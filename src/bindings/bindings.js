import {debounceMicrotask, debounceRender} from '../utils/scheduler.js'
import {parse as parseBindings} from './bindings-parser.js'
import perf from '../perf.js'

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
	#propsMicrotaskDebouncer;
	#propsRenderDebouncer;

	constructor(template) {
		this.parse(template)
	}

	parse(template) {
		this.bindings = parseBindings(template)
	}

	connect(host, state) {
		this.host = host
		this.state = state || host
		this.bindings.forEach((binding) => {
			binding.connect(host)
		})
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
			this.#propsMicrotaskDebouncer = debounceMicrotask(this.#propsMicrotaskDebouncer, () => {
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
}