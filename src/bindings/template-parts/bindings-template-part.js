import TemplatePart from './template-part.js'
import {throttleMicrotask, requestMicrotask} from '../../utils/microtask.js'
import {throttleRender, requestRender} from '../../utils/renderer.js'
import {parse as parseBindings} from '../bindings-parser.js'
import perf from '../../utils/perf.js'

export default class BindingsTemplatePart extends TemplatePart {
	host = null
	isConnected = false

	bindings = [] // [Binding]
	notRelatedMicrotaskProps = []
	notRelatedRenderProps = []

	#isComponenInMicrotaskQueue = false
	#isComponenInRenderQueue = false
	#propsInRenderQueue = new Set
	#propsInMicrotaskQueue = new Set

	#microtaskThrottler = Symbol()
	#renderThrottler = Symbol()
	#propsMicrotaskThrottler = Symbol()
	#propsRenderThrottler = Symbol()

	static parse(root) {
		let part = new BindingsTemplatePart(root)
		return part
	}

	constructor(root) {
		super()
		this.bindings = parseBindings(root)
	}

	connect(host) {
		this.bindings.forEach((binding) => {
			binding.connect(host)
		})
		this.host = host
		this.isConnected = true
	}

	disconnect() {
		this.bindings.forEach((binding) => {
			binding.disconnect()
		})
		this.host = null
		this.isConnected = false
	}

	getRelatedProps() {
		let props = new Set
		this.bindings.forEach((binding) => {
			binding.source.getRelatedProps().forEach((prop) => {
				props.add(prop)
			})
		})
		return props
	}

	update(state, immediate) {
		// host render chunk
		perf.markStart('bindings.update')

		// microtask phase bindings
		this.#isComponenInMicrotaskQueue = true
		let update = () => {
			this.#isComponenInMicrotaskQueue = false

			if (!this.isConnected) {
				return
			}

			this.bindings.forEach((binding) => {
				if (binding.target.constructor.updatePhase === 'microtask') {
					binding.pushValue(state)
				}
			})
		}

		if (immediate) {
			update()
		}
		else {
			requestMicrotask(this.host, this.#microtaskThrottler, update)
		}

		// animationFrame phase bindings
		this.#isComponenInRenderQueue = true
		let render = () => {
			this.#isComponenInRenderQueue = false

			if (!this.isConnected) {
				return
			}

			this.bindings.forEach((binding) => {
				if (binding.target.constructor.updatePhase === 'animationFrame') {
					binding.pushValue(state)
				}
			})
		}

		if (immediate) {
			render()
		}
		else {
			requestRender(this.host, this.#renderThrottler, render)
		}

		perf.markEnd('bindings.update')
	}

	updateProp(state, prop, immediate) {
		perf.markStart('bindings.updateProp')

		// microtask phase bindings
		if (!this.#isComponenInMicrotaskQueue || this.notRelatedMicrotaskProps.includes(prop)) {
			this.#propsInMicrotaskQueue.add(prop)

			let update = () => {
				if (!this.isConnected) {
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
					binding.pushValue(state)
				})
			}

			if (immediate) {
				update()
			}
			else {
				requestMicrotask(this.host, this.#propsMicrotaskThrottler, update)
			}
		}

		// animationFrame phase bindings
		if (!this.#isComponenInRenderQueue || this.notRelatedRenderProps.includes(prop)) {
			this.#propsInRenderQueue.add(prop)

			let render = () => {
				if (!this.isConnected) {
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
					binding.pushValue(state)
				})
			}


			if (immediate) {
				render()
			}
			else {
				requestRender(this.host, this.#propsRenderThrottler, render)
			}
		}

		perf.markEnd('bindings.updateProp')
	}
}