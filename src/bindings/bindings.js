import {getAllChildren, debounceMicrotask, queueRender, debounceRender} from '../helpers.js'
import Binding from './binding.js'

import PropertySourceExpression from './source-expressions/property-source-expression.js'
import PathSourceExpression from './source-expressions/path-source-expression.js'
import ValueSourceExpression from './source-expressions/value-source-expression.js'
import CompoundSourceExpression from './source-expressions/compound-source-expression.js'
import {parse as parseSourceExpression} from './source-expressions/source-expression-parser.js'

import PropertyTargetExpression from './target-expressions/property-target-expression.js'
import {parse as parseTargetExpression} from './target-expressions/target-expression-parser.js'

import perf from '../perf.js'

let sourceExpressionsCache = new Map

export class Bindings {
	host = null
	state = null

	bindings = [] // [Binding]
	notRelatedMicrotaskProps = []
	notRelatedRenderProps = []

	#isComponenInMicrotaskQueue = false
	#isComponenInRenderQueue = false
	#propsInRenderQueue = new Set
	#propsInMicrotaskQueue = new Set
	#updateDebouncer;
	#renderDebouncer;
	#propsMicrotakDebouncer;
	#propsRenderDebouncer;
	#propertiesObserver = (prop) => {
		this.updateProp(prop, this[prop])
	}

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
			perf.markStart('bindings: parse source')
			let [source, direction] = this.parseSourceExpressionMemoized(node.textContent)
			perf.markEnd('bindings: parse source')
			if (!source) {
				return
			}
			perf.markStart('bindings: parse target')
			let target = parseTargetExpression('node', node)
			perf.markEnd('bindings: parse target')
			if (!target) {
				return
			}

			let binding = this.createBinding(direction, source, target)
			if (!binding) {
				return
			}

			this.bindings.push(binding)
			node.textContent = ''
		}

		getAllChildren(template).forEach((el) => {
			// attributes
			el.getAttributeNames().forEach((attr) => {
				perf.markStart('bindings: parse source')
				// todo: remove
				let value = el.getAttribute(attr)
				if (attr.startsWith('on-') && !value.startsWith('[')) {
					value = `[[${value}]]`
				}
				let [source, direction] = this.parseSourceExpressionMemoized(value)
				perf.markEnd('bindings: parse source')
				perf.markStart('bindings: parse target')
				let target = parseTargetExpression('attribute', el, attr, source)
				perf.markEnd('bindings: parse target')

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

				// todo: remove
				if (!source) {
					return
				}

				let binding = this.createBinding(direction, source, target)
				if (!binding) {
					return
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

	createBinding(direction, source, target) {
		if (direction !== 'downward' && !(target instanceof PropertyTargetExpression)) {
			console.error('upward and two-way binding can only be property binding')
			return
		}
		return new Binding(direction, source, target)
	}

	parseSourceExpressionMemoized(text) {
		if (sourceExpressionsCache.has(text)) {
			return sourceExpressionsCache.get(text)
		}
		let result = this.parseSourceExpression(text)
		sourceExpressionsCache.set(text, result)
		return result
	}

	parseSourceExpression(text) {
		let chunks = [text]
		let downwardOnly = true
		let bindingDirection = ''

		let findAndReplace = (direction, regex) => {
			let nextChunk
			let nextChunkIndex
			let match

			for (let [index, chunk] of chunks.entries()) {
				if (typeof chunk !== 'string') {
					continue
				}
				match = chunk.match(regex)
				if (match) {
					nextChunk = chunk
					nextChunkIndex = index
					break
				}
			}

			if (!match) {
				return
			}

			let expr = parseSourceExpression(match[2], {negate: !!match[1]})
			if (!expr) {
				return
			}
			let [pre, ...post] = nextChunk.split(match[0])
			chunks.splice(nextChunkIndex, 1, pre, expr, post.join(match[0]))

			if (direction !== 'downward') {
				downwardOnly = false
			}
			bindingDirection = direction

			findAndReplace(direction, regex)
		}
		findAndReplace('downward', /\[\[(!?)(.*?)\]\]/)
		findAndReplace('upward', /\(\((!?)(.*?)\)\)/)
		findAndReplace('two-way',  /\{\{(!?)(.*?)\}\}/)

		chunks = chunks.filter(x => x)

		let noExpressions = !chunks.length || chunks.every((chunk) => {
			return typeof chunk === 'string'
		})
		if (noExpressions) {
			return []
		}

		let expressions = chunks.filter(x => x).map((chunk) => {
			if (typeof chunk === 'string') {
				return new ValueSourceExpression({value: chunk})
			}
			return chunk
		})

		// single expression
		if (expressions.length === 1) {
			let expr = expressions[0]

			if (bindingDirection !== 'downward' && !(expr instanceof PropertySourceExpression) && !(expr instanceof PathSourceExpression)) {
				console.error('upward and two-way binding can only be property binding', `"${text}"`)
				return []
			}

			return [expr, bindingDirection]
		}

		// compound expression
		if (!downwardOnly) {
			console.error('compound binding can only contain downward bindings', `"${text}"`)
			return []
		}
		return [new CompoundSourceExpression({chunks: expressions}), bindingDirection]
	}

	connect(host) {
		this.host = host
		this.state = host
		this.getAllRelatedProps().forEach((prop) => {
			this.host.observeProperty(prop)
		})
		this.host.addPropertiesObserver(this.#propertiesObserver)
		this.bindings.forEach((binding) => {
			binding.connect(host)
		})
	}

	disconnect() {
		this.host.removePropertiesObserver(this.#propertiesObserver)
		this.host = null
	}

	update() {
		perf.markStart('bindings.update')

		// microtask phase bindings
		this.#isComponenInMicrotaskQueue = true
		this.#updateDebouncer = debounceMicrotask(this.#updateDebouncer, () => {
			this.#isComponenInMicrotaskQueue = false

			if (!this.host) {
				return
			}

			this.bindings.forEach((binding) => {
				if (binding.target.constructor.updatePhase === 'microtask') {
					binding.pushValue(this.state, this.host)
				}
			})
		})

		// animationFrame phase bindings
		this.#isComponenInRenderQueue = true
		this.#renderDebouncer = debounceRender(this.#renderDebouncer, () => {
			this.#isComponenInRenderQueue = false

			if (!this.host) {
				return
			}

			this.bindings.forEach((binding) => {
				if (binding.target.constructor.updatePhase === 'animationFrame') {
					binding.pushValue(this.state, this.host)
				}
			})
		})

		perf.markEnd('bindings.update')
	}

	updateProp(prop) {
		perf.markStart('bindings.updateProp')

		// microtask phase bindings
		if (!this.#isComponenInMicrotaskQueue || this.notRelatedMicrotaskProps.includes(prop)) {
			this.#propsInMicrotaskQueue.add(prop)
			this.#propsMicrotakDebouncer = debounceMicrotask(this.#propsMicrotakDebouncer, () => {
				if (!this.host) {
					return
				}

				let relatedBindings = new Set
				this.#propsInMicrotaskQueue.forEach((prop) => {
					this.bindings.forEach((binding) => {
						if (binding.isPropRelated(prop) && binding.target.constructor.updatePhase === 'microtask') {
							relatedBindings.add(binding)
						}
					})
				})
				this.#propsInMicrotaskQueue.clear()

				if (!relatedBindings.size) {
					this.notRelatedMicrotaskProps.push(prop)
					if (this.notRelatedMicrotaskProps.length > 3) {
						this.notRelatedMicrotaskProps.shift()
					}
				}

				relatedBindings.forEach((binding) => {
					binding.pushValue(this.state, this.host)
				})
			})
		}

		// animationFrame phase bindings
		if (!this.#isComponenInRenderQueue || this.notRelatedRenderProps.includes(prop)) {
			this.#propsInRenderQueue.add(prop)
			this.#propsRenderDebouncer = debounceRender(this.#propsRenderDebouncer, () => {
				if (!this.host) {
					return
				}

				let relatedBindings = new Set
				this.#propsInRenderQueue.forEach((prop) => {
					this.bindings.forEach((binding) => {
						if (binding.isPropRelated(prop) && binding.target.constructor.updatePhase === 'animationFrame') {
							relatedBindings.add(binding)
						}
					})
				})
				this.#propsInRenderQueue.clear()

				if (!relatedBindings.size) {
					this.notRelatedRenderProps.push(prop)
					if (this.notRelatedRenderProps.length > 3) {
						this.notRelatedRenderProps.shift()
					}
				}

				relatedBindings.forEach((binding) => {
					binding.pushValue(this.state, this.host)
				})
			})
		}

		perf.markEnd('bindings.updateProp')
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