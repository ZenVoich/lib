import {getAllChildren, debouncer} from '../helpers.js'
import Binding from './binding.js'

import {
	ValueSourceExpression,
	PropertySourceExpression,
	PathSourceExpression,
	CallSourceExpression,
	CompoundSourceExpression,
} from './source-expressions.js'

import AttributeTargetExpression from './target-expressions/attribute-target-expression.js'
import EventTargetExpression from './target-expressions/event-target-expression.js'
import NodeTargetExpression from './target-expressions/node-target-expression.js'
import PropertyTargetExpression from './target-expressions/property-target-expression.js'
import ShowHideTargetExpression from './target-expressions/show-hide-target-expression.js'


export class Bindings {
	host = null
	state = null

	bindings = [] // [Binding]
	notRelatedProps = []

	#targetExpressions = [
		PropertyTargetExpression,
		AttributeTargetExpression,
		NodeTargetExpression,
		EventTargetExpression,
		ShowHideTargetExpression,
	].sort((a, b) => {
		return b.parsePriority - a.parsePriority
	})

	#isComponenInRenderQueue = false
	#propsInRenderQueue = new Set
	#propertiesObserver = (prop) => {
		this.updateProp(prop, this[prop])
	}
	#updateDebouncer;
	#updatePropDebouncer;

	constructor(template) {
		this.parse(template)
	}

	parse(template) {
		if (!template) {
			return
		}

		this.bindings = []

		// text node target
		let processNode = (node) => {
			let source = this.parseSourceExpression(node.textContent)
			if (!source) {
				return
			}

			let target
			this.#targetExpressions.find((exprClass) => {
				if (exprClass.parseType == 'node') {
					target = exprClass.parse(node)
					return target
				}
			})

			if (!target) {
				return
			}

			let binding = new Binding
			binding.direction = 'downward'
			binding.source = source
			binding.target = target

			this.bindings.push(binding)
			node.textContent = ''
		}

		getAllChildren(template).forEach((el) => {
			// attributes
			el.getAttributeNames().forEach((attr) => {
				let source = this.parseSourceExpression(el.getAttribute(attr))
				if (!source) {
					return
				}

				let target
				this.#targetExpressions.find((exprClass) => {
					if (exprClass.parseType == 'attribute') {
						target = exprClass.parse(el, attr, source)
						return target
					}
				})
				if (!target) {
					return
				}

				let binding = new Binding
				binding.direction = 'downward'
				binding.source = source
				binding.target = target
				this.bindings.push(binding)
				el.removeAttribute(attr)
			})

			// content
			let textNodesOnly = [...el.childNodes].every((node) => {
				return node.nodeType === document.TEXT_NODE
			})
			if (textNodesOnly) {
				processNode(el)
			}
			else {
				![...el.childNodes].forEach((node) => {
					if (node.nodeType === document.TEXT_NODE) {
						processNode(node)
					}
				})
			}
		})
		// root text nodes
		![...template.childNodes].forEach((node) => {
			if (node.nodeType === document.TEXT_NODE) {
				processNode(node)
			}
		})
	}

	// todo: refactor
	parseSourceExpression(text) {
		let start = `\\[\\[`
		let end = `\\]\\]`

		let string = `'([^']*)'`
		let arg = `([a-z_]+(?:\\.[a-z_]+)*|'[^']*'|[0-9]+)`

		let regExps = {
			call: new RegExp(`\\[\\[([a-z_]+)\\(${arg}(?:\\s*,\\s*${arg})*\\)\\]\\]`, 'ig'),
			path: /\[\[([a-z_]+(?:\.[a-z_]+)+)\]\]/ig,
			prop: /\[\[([a-z_]+)\]\]/ig,
			string: new RegExp(`\\[\\[${string}\\]\\]`, 'ig'),
			number: /\[\[([0-9]+)\]\]/ig,
		}
		let expressions = []
		let tempText = text
		let hasMatch = false

		Object.entries(regExps).forEach(([type, regExp]) => {
			let match
			while (match = regExp.exec(text)) {
				hasMatch = true
				let index = tempText.indexOf(match[0])
				let str = tempText.substr(0, index)
				// pre text
				if (str) {
					tempText = tempText.replace(str, '')
					let expr = this.parseSourceExpression(str)
					if (expr) {
						expressions.push(expr)
					}
					else {
						expressions.push(new ValueSourceExpression({value: str}))
					}
				}
				// expr
				tempText = tempText.replace(match[0], '')
				// prop
				if (type == 'prop') {
					expressions.push(new PropertySourceExpression({propertyName: match[1]}))
				}
				// path
				else if (type == 'path') {
					expressions.push(new PathSourceExpression({path: match[1].split('.')}))
				}
				// call
				else if (type == 'call') {
					let [_, fn, ...args] = match;
					args = args.map((arg) => this.parseSourceExpression(`[[${arg}]]`))
					expressions.push(new CallSourceExpression({functionName: fn, args: args}))
				}
				// static value
				else if (type == 'string' || type == 'number') {
					let value = type == 'number' ? parseFloat(match[1]) : match[1]
					expressions.push(new ValueSourceExpression({value: value}))
				}
			}
			text = tempText
		})
		if (!hasMatch) {
			return
		}
		// post text
		if (tempText) {
			expressions.push(new ValueSourceExpression({value: tempText}))
		}

		// single expression
		if (expressions.length == 1) {
			return expressions[0];
		}
		// compound expression
		return new CompoundSourceExpression({chunks: expressions})
	}

	connect(host) {
		this.host = host
		this.state = host
		this.getAllRelatedProps().forEach((prop) => {
			this.host.observeProperty(prop)
		})
		this.host.addPropertiesObserver(this.#propertiesObserver)
	}

	disconnect() {
		this.host.removePropertiesObserver(this.#propertiesObserver)
		this.host = null
	}

	update() {
		// prop target bindings update by microtask
		this.#updateDebouncer = debouncer.microtask(this.#updateDebouncer, () => {
			this.bindings.forEach((binding) => {
				if (binding.target.constructor.updatePhase == 'microtask') {
					binding.pushValue(this.state, this.host)
				}
			})
		})

		if (this.#isComponenInRenderQueue) {
			return
		}

		// other bindings update by rAF
		requestAnimationFrame(() => {
			this.#isComponenInRenderQueue = false
			this.bindings.forEach((binding) => {
				if (binding.target.constructor.updatePhase == 'rAF') {
					binding.pushValue(this.state, this.host)
				}
			})
		})
		this.#isComponenInRenderQueue = true
	}

	updateProp(prop) {
		// no need to queue the prop if entire component is invalidated
		if (this.#isComponenInRenderQueue) {
			return
		}

		if (this.notRelatedProps.includes(prop)) {
			return
		}

		// prop target bindings update by microtask
		this.#updatePropDebouncer = debouncer.microtask(this.#updatePropDebouncer, () => {
			let relatedBindings = new Set
			this.#propsInRenderQueue.forEach((prop) => {
				this.bindings.forEach((binding) => {
					if (binding.isPropRelated(prop) && binding.target.constructor.updatePhase == 'microtask') {
						relatedBindings.add(binding)
					}
				})
			})

			// if (!relatedBindings.size) {
			// 	this.notRelatedProps.push(prop)
			// 	if (this.notRelatedProps.length > 3) {
			// 		this.notRelatedProps.shift()
			// 	}
			// }
			relatedBindings.forEach((binding) => {
				binding.pushValue(this.state, this.host)
			})
		})
		let queued = this.#propsInRenderQueue.size
		this.#propsInRenderQueue.add(prop)

		if (queued) {
			return
		}

		// other bindings update by rAF
		requestAnimationFrame(() => {
			let relatedBindings = new Set
			this.#propsInRenderQueue.forEach((prop) => {
				this.bindings.forEach((binding) => {
					if (binding.isPropRelated(prop) && binding.target.constructor.updatePhase == 'rAF') {
						relatedBindings.add(binding)
					}
				})
			})
			this.#propsInRenderQueue.clear()

			relatedBindings.forEach((binding) => {
				binding.pushValue(this.state, this.host)
			})
		})
	}

	getAllRelatedProps() {
		let props = new Set
		this.bindings.forEach((binding) => {
			binding.source.getRelatedProps().forEach((prop) => {
				props.add(prop)
			})
		})
		return props
	}
}