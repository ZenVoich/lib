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
	AttributeTargetExpression,
	NodeTargetExpression,
	EventTargetExpression,
	ShowHideTargetExpression,
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
				// show/hide target
				else if (['show-if', 'hide-if'].includes(attr)) {
					binding.target = new ShowHideTargetExpression
					binding.target.element = el
					binding.target.type = attr.slice(0, -3)
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
		let props = new Set
		this.bindings.forEach((binding) => {
			binding.source.getRelatedProps().forEach((prop) => {
				props.add(prop)
			})
		})
		return props
	}
}