import {parseSkeleton, fromSkeleton} from './template-parser.js'
import {observe} from '../data-flow/observer.js'
import {requestMicrotask} from '../utils/microtask.js'
import {requestRender} from '../utils/renderer.js'

export class TemplateRoot {
	host
	relatedPaths
	relatedProps
	parts = []
	contextStates = []

	#unobserveList = []
	#updatePendingPaths = new Set
	#renderPendingPaths = new Set
	#updateThrottler = Symbol()
	#renderThrottler = Symbol()

	static parseSkeleton(template) {
		return {
			skeletonTemplate: template,
			partSkeletons: parseSkeleton(template),
		}
	}

	static fromSkeleton(skeleton, template) {
		let templateRoot = new TemplateRoot
		templateRoot.template = template || skeleton.skeletonTemplate.cloneNode(true)
		templateRoot.parts = fromSkeleton(skeleton.partSkeletons, templateRoot.template)

		templateRoot.parts.forEach((part) => {
			part.parentTemplateRoot = templateRoot
		})

		if (!skeleton.relatedPaths) {
			let relatedPaths = new Set
			templateRoot.parts.forEach((part) => {
				part.relatedPaths.forEach((path) => {
					relatedPaths.add(path)
				})
			})
			skeleton.relatedPaths = relatedPaths
			skeleton.relatedProps = new Set
			relatedPaths.forEach((path) => {
				skeleton.relatedProps.add(path.split('.')[0])
			})
		}
		templateRoot.relatedPaths = skeleton.relatedPaths
		templateRoot.relatedProps = skeleton.relatedProps

		return templateRoot
	}

	static parse(template) {
		return this.fromSkeleton(this.parseSkeleton(template))
	}

	get content() {
		return this.template.content
	}

	connect(host, dirtyCheck = false) {
		this.host = host
		this.parts.forEach((part) => {
			part.connect(host, {dirtyCheck})
		})

		if (dirtyCheck) {
			this.#unobserveList = [...this.relatedPaths].map((path) => {
				let prop = path.split('.')[0]
				return observe(host, prop, (oldVal, newVal) => {
					this.updateProp(prop)
				})
			})
		}
		else {
			this.#unobserveList = [...this.relatedPaths].map((path) => {
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
	}

	_getState() {
		let hostState = {localName: this.host.localName}
		this.relatedProps.forEach((prop) => {
			hostState[prop] = this.host[prop]
		})
		return Object.assign(hostState, ...this.contextStates)
	}

	disconnect() {
		this.host = null
		this.parts.forEach((part) => {
			part.disconnect()
		})
		this.#unobserveList.forEach((unobserve) => {
			unobserve()
		})
	}

	update(paths, ignoreUndefined = false) {
		this.action('update', paths, ignoreUndefined)
	}

	render(paths, ignoreUndefined = false) {
		this.action('render', paths, ignoreUndefined)
	}

	action(action, paths, ignoreUndefined = false) {
		if (!this.host) {
			return
		}
		let state = this._getState()
		this.parts.forEach((part) => {
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
		requestMicrotask(this.host, this.#updateThrottler, () => {
			this.update(this.#updatePendingPaths)
		})
	}

	requestRenderPath(path) {
		this.#renderPendingPaths.add(path)
		requestRender(this.host, this.#renderThrottler, () => {
			this.render(this.#renderPendingPaths)
		})
	}

	// updateProp(prop) {
	// 	if (!this.host) {
	// 		return
	// 	}
	// 	let state = this._getState()
	// 	this.parts.forEach((part) => {
	// 		for (let path of part.relatedPaths) {
	// 			if (path === prop || path.startsWith(prop + '.')) {
	// 				part.updatePath(state, prop)
	// 				break
	// 			}
	// 		}
	// 	})
	// }
}