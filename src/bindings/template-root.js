import {parseSkeleton, fromSkeleton} from './template-parser.js'
import {observe} from '../data-flow/observer.js'
import {requestMicrotask} from '../utils/microtask.js'
import {requestRender} from '../utils/renderer.js'

export class TemplateRoot {
	static parseSkeleton(template) {
		let partSkeletons = parseSkeleton(template)
		let relatedPaths = new Set
		let relatedProps = new Set

		partSkeletons.forEach((items) => {
			items.forEach(({partSkeleton}) => {
				partSkeleton.relatedPaths.forEach((path) => {
					relatedPaths.add(path)
					relatedProps.add(path.split('.')[0])
				})
			})
		})

		return {
			skeletonTemplate: template,
			partSkeletons,
			relatedPaths,
			relatedProps,
		}
	}

	contextStates = []

	#host
	#template
	#parts = []
	#relatedPaths
	#relatedProps

	#unobserveList = []
	#updatePendingPaths = new Set
	#renderPendingPaths = new Set
	#updateThrottler = Symbol()
	#renderThrottler = Symbol()
	#cancelMicrotask
	#cancelRender

	constructor({skeletonTemplate, partSkeletons, relatedPaths, relatedProps}, template) {
		this.#template = template || skeletonTemplate.cloneNode(true)
		this.#parts = fromSkeleton(partSkeletons, this.#template)
		this.#relatedPaths = relatedPaths
		this.#relatedProps = relatedProps

		this.#parts.forEach((part) => {
			part.parentTemplateRoot = this
		})
	}

	get isConnected() {
		return !!this.#host
	}

	get template() {
		return this.#template
	}

	get parts() {
		return this.#parts
	}

	get relatedPaths() {
		return this.#relatedPaths
	}

	get content() {
		return this.#template.content
	}

	connect(host, dirtyCheck = false) {
		this.#host = host

		if (dirtyCheck) {
			this.#unobserveList = [...this.#relatedPaths].map((path) => {
				let prop = path.split('.')[0]
				return observe(host, prop, (oldVal, newVal) => {
					this.updateProp(prop)
				})
			})
		}
		else {
			this.#unobserveList = [...this.#relatedPaths].map((path) => {
				let target = host

				if (this.contextStates.length) {
					let prop = path.split('.')[0]

					for (let i = this.contextStates.length - 1; i >= 0; i--) {
						let state = this.contextStates[i]
						if (Object.keys(state).includes(prop)) {
							target = state
							break
						}
					}
				}

				return observe(target, path, (oldVal, newVal) => {
					this.requestUpdatePath(path)
					this.requestRenderPath(path)
				})
			})
		}

		this.#parts.forEach((part) => {
			part.connect(host, {dirtyCheck})
		})
	}

	_getState() {
		let hostState = {}
		this.#relatedProps.forEach((prop) => {
			hostState[prop] = this.#host[prop]
		})
		return Object.assign(hostState, ...this.contextStates)
	}

	disconnect() {
		this.#host = null
		this.#parts.forEach((part) => {
			part.disconnect()
		})
		this.#unobserveList.forEach((unobserve) => {
			unobserve()
		})
		this.#unobserveList = []

		if (this.#cancelMicrotask) {
			this.#cancelMicrotask()
			this.#cancelMicrotask = null
		}
		if (this.#cancelRender) {
			this.#cancelRender()
			this.#cancelRender = null
		}
	}

	update(paths, ignoreUndefined = false) {
		this.action('update', paths, ignoreUndefined)
	}

	render(paths, ignoreUndefined = false) {
		this.action('render', paths, ignoreUndefined)
	}

	action(action, paths, ignoreUndefined = false) {
		if (!this.#host) {
			return
		}
		let state = this._getState()
		this.#parts.forEach((part) => {
			if (paths) {
				for (let path of paths) {
					if (part.relatedPaths.has(path)) {
						part[action](state, paths, ignoreUndefined)
						break
					}
				}
			}
			else {
				part[action](state, null, ignoreUndefined)
			}
		})
	}

	requestUpdatePath(path) {
		this.#updatePendingPaths.add(path)
		this.#cancelMicrotask = requestMicrotask(this.#host, this.#updateThrottler, () => {
			this.#cancelMicrotask = null
			let paths = new Set(this.#updatePendingPaths)
			this.#updatePendingPaths.clear()
			this.update(paths)
		})
	}

	requestRenderPath(path) {
		this.#renderPendingPaths.add(path)
		this.#cancelRender = requestRender(this.#host, this.#renderThrottler, () => {
			this.#cancelRender = null
			let paths = new Set(this.#renderPendingPaths)
			this.#renderPendingPaths.clear()
			this.render(paths)
		})
	}

	// updateProp(prop) {
	// 	if (!this.#host) {
	// 		return
	// 	}
	// 	let state = this._getState()
	// 	this.#parts.forEach((part) => {
	// 		for (let path of part.relatedPaths) {
	// 			if (path === prop || path.startsWith(prop + '.')) {
	// 				part.updatePath(state, prop)
	// 				break
	// 			}
	// 		}
	// 	})
	// }
}