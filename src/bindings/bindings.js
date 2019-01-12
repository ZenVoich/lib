import {getAllChildren, debounceMicrotask, queueRender} from '../helpers.js'
import Binding from './binding.js'

import ValueSourceExpression from './source-expressions/value-source-expression.js'
import CompoundSourceExpression from './source-expressions/compound-source-expression.js'
import {parse as parseSourceExpression} from './source-expressions/source-expression-parser.js'

import PropertyTargetExpression from './target-expressions/property-target-expression.js'
import {parse as parseTargetExpression} from './target-expressions/target-expression-parser.js'


export class Bindings {
	host = null
	state = null

	bindings = [] // [Binding]
	notRelatedProps = []

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
			let target = parseTargetExpression('node', node)
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
				let target = parseTargetExpression('attribute', el, attr, source)

				if (!target) {
					return
				}

				// <div .prop="val">
				if (!source) {
					if (target instanceof PropertyTargetExpression) {
						source = new ValueSourceExpression({value: el.getAttribute(attr)})
					}
					else {
						return
					}
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

	parseSourceExpression(text) {
		let chunks = [text]

		let findAndReplace = () => {
			let nextChunk
			let nextChunkIndex
			let match

			for (let [index, chunk] of chunks.entries()) {
				if (typeof chunk != 'string') {
					continue
				}
				match = chunk.match(/\[\[(.*?)\]\]/)
				if (match) {
					nextChunk = chunk
					nextChunkIndex = index
					break
				}
			}

			if (!match) {
				return
			}

			let expr = parseSourceExpression(match[1])
			if (!expr) {
				return
			}
			let [pre, ...post] = nextChunk.split(match[0])
			chunks.splice(nextChunkIndex, 1, pre, expr, post.join(match[0]))

			findAndReplace()
		}
		findAndReplace()

		chunks = chunks.filter(x => x)

		let noExpressions = !chunks.length || chunks.every((chunk) => {
			return typeof chunk == 'string'
		})
		if (noExpressions) {
			return
		}

		let expressions = chunks.filter(x => x).map((chunk) => {
			if (typeof chunk == 'string') {
				return new ValueSourceExpression({value: chunk})
			}
			return chunk
		})

		// single expression
		if (expressions.length == 1) {
			return expressions[0]
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
		this.#updateDebouncer = debounceMicrotask(this.#updateDebouncer, () => {
			if (!this.host) {
				return
			}

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
		queueRender(() => {
			if (!this.host) {
				return
			}

			this.#isComponenInRenderQueue = false
			this.bindings.forEach((binding) => {
				if (binding.target.constructor.updatePhase == 'animationFrame') {
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
		this.#updatePropDebouncer = debounceMicrotask(this.#updatePropDebouncer, () => {
			if (!this.host) {
				return
			}

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
		queueRender(() => {
			if (!this.host) {
				return
			}

			let relatedBindings = new Set
			this.#propsInRenderQueue.forEach((prop) => {
				this.bindings.forEach((binding) => {
					if (binding.isPropRelated(prop) && binding.target.constructor.updatePhase == 'animationFrame') {
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