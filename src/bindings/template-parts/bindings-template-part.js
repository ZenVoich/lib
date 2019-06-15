import {TemplatePart} from './template-part.js'
import {requestMicrotask} from '../../utils/microtask.js'
import {requestRender} from '../../utils/renderer.js'
import {parseSkeleton, fromSkeleton} from '../bindings-parser.js'
import {perf} from '../../utils/perf.js'

export class BindingsTemplatePart extends TemplatePart {
	host = null
	isConnected = false
	dirtyCheck = false
	relatedPaths

	bindings = [] // [Binding]

	#isComponenInMicrotaskQueue = false
	#isComponenInRenderQueue = false
	#pathsInRenderQueue = new Set
	#pathsInMicrotaskQueue = new Set

	#microtaskThrottler = Symbol()
	#renderThrottler = Symbol()
	#pathsMicrotaskThrottler = Symbol()
	#pathsRenderThrottler = Symbol()

	static parseSkeleton(root) {
		return parseSkeleton(root)
	}

	static fromSkeleton(skeleton, root) {
		return new BindingsTemplatePart(fromSkeleton(skeleton, root))
	}

	constructor(bindings) {
		super()
		this.bindings = bindings

		this.relatedPaths = new Set
		bindings.forEach((binding) => {
			binding.source.relatedPaths.forEach((path) => {
				this.relatedPaths.add(path)
			})
		})
	}

	connect(host, {dirtyCheck = false} = {}) {
		this.bindings.forEach((binding) => {
			binding.connect(host)
		})
		this.host = host
		this.dirtyCheck = dirtyCheck
		this.isConnected = true
	}

	disconnect() {
		this.bindings.forEach((binding) => {
			binding.disconnect()
		})
		this.host = null
		this.isConnected = false
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

	updatePath(state, path, immediate) {
		perf.markStart('bindings.updatePath')

		// microtask phase bindings
		if (!this.#isComponenInMicrotaskQueue) {
			this.#pathsInMicrotaskQueue.add(path)

			let update = () => {
				if (!this.isConnected) {
					return
				}

				let relatedBindings = new Set
				this.#pathsInMicrotaskQueue.forEach((path) => {
					this.bindings.forEach((binding) => {
						if (this._isBindingRelated(binding, path, 'microtask')) {
							relatedBindings.add(binding)
						}
					})
				})

				this.#pathsInMicrotaskQueue.clear()

				relatedBindings.forEach((binding) => {
					binding.pushValue(state)
				})
			}

			if (immediate) {
				update()
			}
			else {
				requestMicrotask(this.host, this.#pathsMicrotaskThrottler, update)
			}
		}

		// animationFrame phase bindings
		if (!this.#isComponenInRenderQueue) {
			this.#pathsInRenderQueue.add(path)

			let render = () => {
				if (!this.isConnected) {
					return
				}

				let relatedBindings = new Set
				this.#pathsInRenderQueue.forEach((path) => {
					this.bindings.forEach((binding) => {
						if (this._isBindingRelated(binding, path, 'animationFrame')) {
							relatedBindings.add(binding)
						}
					})
				})
				this.#pathsInRenderQueue.clear()

				relatedBindings.forEach((binding) => {
					binding.pushValue(state)
				})
			}


			if (immediate) {
				render()
			}
			else {
				requestRender(this.host, this.#pathsRenderThrottler, render)
			}
		}

		perf.markEnd('bindings.updatePath')
	}

	_isBindingRelated(binding, path, phase) {
		if (binding.target.constructor.updatePhase !== phase) {
			return false
		}
		if (this.dirtyCheck) {
			for (let p of binding.source.relatedPaths) {
				if (p.startsWith(path + '.')) {
					return true
				}
			}
		} else {
			return binding.isPathRelated(path)
		}
	}
}

window.BindingsTemplatePart = BindingsTemplatePart