import {getAllChildren, debouncer} from '../helpers.js'
import Binding from './binding.js'

import {
	ValueSourceExpression,
	PropertySourceExpression,
	PathSourceExpression,
	CallSourceExpression,
	CompoundSourceExpression,
} from './source-expressions.js'

import {
	PropertyTargetExpression,
	EventTargetExpression,
	AttributeTargetExpression,
	NodeTargetExpression,
} from './target-expressions.js'

export class Bindings {
	bindings = [] // [Binding]
	#propertiesObserver = (prop) => {
		this.updateProp(prop, this[prop])
	}
	#updateDebouncer;
	#updatePropDebouncer;

	constructor(template) {
		this.parse(template)
		this.isComponenInRenderQueue = false
		this.propsInRenderQueue = new Set
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
			let binding = new Binding
			binding.direction = 'downward'
			binding.source = source
			binding.target = new NodeTargetExpression
			binding.target.node = node

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
				let binding = new Binding
				binding.direction = 'downward'
				binding.source = source

				// prop target
				if (attr.startsWith('.')) {
					binding.target = new PropertyTargetExpression
					binding.target.element = el
					binding.target.propertyName = attr.slice(1)
				}
				// event target
				else if (attr.startsWith('on-')) {
					if (!(binding.source instanceof PropertySourceExpression)) {
						console.error('Provide function name expression for "on-" binding')
						return
					}
					binding.target = new EventTargetExpression
					binding.target.element = el
					binding.target.eventName = attr.slice(3)
					binding.target.functionName = binding.source.propertyName
				}
				// attr target
				else {
					binding.target = new AttributeTargetExpression
					binding.target.element = el
					binding.target.attributeName = attr
				}

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

	parseSourceExpression(text) {
		let regExps = {
			call: /\[\[(\w+)\((\w+(?:\.\w+)*)(?:\s*,\s*(\w+(?:\.\w+)*))*\)\]\]/g,
			path: /\[\[(\w+(?:\.\w+)+)\]\]/g,
			prop: /\[\[(\w+)\]\]/g,
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
				if (binding.target instanceof PropertyTargetExpression) {
					binding.pushValue(this.host)
				}
			})
		})

		if (this.isComponenInRenderQueue) {
			return
		}

		// other bindings update by rAF
		requestAnimationFrame(() => {
			this.isComponenInRenderQueue = false
			this.bindings.forEach((binding) => {
				if (!(binding.target instanceof PropertyTargetExpression)) {
					binding.pushValue(this.host)
				}
			})
		})
		this.isComponenInRenderQueue = true
	}

	updateProp(prop) {
		// prop target bindings update by microtask
		this.#updatePropDebouncer = debouncer.microtask(this.#updatePropDebouncer, () => {
			let relatedBindings = new Set
			this.propsInRenderQueue.forEach((prop) => {
				this.bindings.forEach((binding) => {
					if (binding.isPropRelated(prop) && binding.target instanceof PropertyTargetExpression) {
						relatedBindings.add(binding)
					}
				})
			})
			relatedBindings.forEach((binding) => {
				binding.pushValue(this.host)
			})
		})

		// no need to queue the prop if entire component is invalidated
		if (this.isComponenInRenderQueue) {
			return
		}
		let queued = this.propsInRenderQueue.size
		this.propsInRenderQueue.add(prop)

		if (queued) {
			return
		}

		// other bindings update by rAF
		requestAnimationFrame(() => {
			let relatedBindings = new Set
			this.propsInRenderQueue.forEach((prop) => {
				this.bindings.forEach((binding) => {
					if (binding.isPropRelated(prop) && !(binding.target instanceof PropertyTargetExpression)) {
						relatedBindings.add(binding)
					}
				})
			})
			this.propsInRenderQueue.clear()

			relatedBindings.forEach((binding) => {
				binding.pushValue(this.host)
			})
		})
	}

	getAllRelatedProps() {
		let getProps = (source) => {
			let props = new Set

			if (source instanceof PropertySourceExpression) {
				props.add(source.propertyName)
			}
			else if (source instanceof PathSourceExpression) {
				props.add(source.path[0])
			}
			else if (source instanceof CallSourceExpression) {
				source.args.forEach((source) => {
					getProps(source).forEach((prop) => {
						props.add(prop)
					})
				})
			}
			else if (source instanceof CompoundSourceExpression) {
				source.chunks.forEach((source) => {
					getProps(source).forEach((prop) => {
						props.add(prop)
					})
				})
			}

			return props
		}

		let props = new Set
		this.bindings.forEach((binding) => {
			getProps(binding.source).forEach((prop) => {
				props.add(prop)
			})
		})
		return props
	}
}