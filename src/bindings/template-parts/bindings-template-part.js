import TemplatePart from './template-part.js'
import {throttleMicrotask} from '../../utils/microtask.js'
import {throttleRender} from '../../utils/renderer.js'
import {parse as parseBindings} from '../bindings-parser.js'
import perf from '../../utils/perf.js'

export default class BindingsTemplatePart extends TemplatePart {
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
		this.isConnected = true
	}

	disconnect() {
		this.bindings.forEach((binding) => {
			binding.disconnect()
		})
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

	update(state) {
		// host render chunk
		perf.markStart('bindings.update')

		// microtask phase bindings
		this.#isComponenInMicrotaskQueue = true
		throttleMicrotask(this.#microtaskThrottler, () => {
			this.#isComponenInMicrotaskQueue = false

			if (!this.isConnected) {
				return
			}

			this.bindings.forEach((binding) => {
				if (binding.target.constructor.updatePhase === 'microtask') {
					binding.pushValue(state)
				}
			})
		})

		// animationFrame phase bindings
		this.#isComponenInRenderQueue = true
		throttleRender(this.#renderThrottler, () => {
			this.#isComponenInRenderQueue = false

			if (!this.isConnected) {
				return
			}

			this.bindings.forEach((binding) => {
				if (binding.target.constructor.updatePhase === 'animationFrame') {
					binding.pushValue(state)
				}
			})
		})

		perf.markEnd('bindings.update')
	}

	updateProp(state, prop) {
		perf.markStart('bindings.updateProp')

		// microtask phase bindings
		if (!this.#isComponenInMicrotaskQueue || this.notRelatedMicrotaskProps.includes(prop)) {
			this.#propsInMicrotaskQueue.add(prop)
			throttleMicrotask(this.#propsMicrotaskThrottler, () => {
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
			})
		}

		// animationFrame phase bindings
		if (!this.#isComponenInRenderQueue || this.notRelatedRenderProps.includes(prop)) {
			this.#propsInRenderQueue.add(prop)
			throttleRender(this.#propsRenderThrottler, () => {
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
			})
		}

		perf.markEnd('bindings.updateProp')
	}
}