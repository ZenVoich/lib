import {parseSkeleton, fromSkeleton} from './template-parser.js'
import {observeHostProperty} from '../utils/property-observer.js'
import {observe} from '../data-flow/observer.js'
import {observePath} from '../data-flow/proxy-object.js'

export class TemplateRoot {
	host
	relatedPaths
	relatedProps
	parts = []
	contextStates = []
	#unobservers = []

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
			this.#unobservers = [...this.relatedPaths].map((path) => {
				let prop = path.split('.')[0]
				return observeHostProperty(host, prop, (oldVal, newVal) => {
					this.updateProp(prop)
				})
			})
		}
		else {
			this.#unobservers = [...this.relatedPaths].map((path) => {
				return observe(host, this._getState(), path, (oldVal, newVal) => {
					this.updatePath(path)
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
		this.#unobservers.forEach((unobserver) => {
			unobserver()
		})
	}

	update(immediate) {
		if (!this.host) {
			return
		}
		let state = this._getState()
		this.parts.forEach((part) => {
			part.update(state, immediate)
		})
	}

	updateProp(prop, immediate) {
		if (!this.host) {
			return
		}
		let state = this._getState()
		this.parts.forEach((part) => {
			for (let path of part.relatedPaths) {
				if (path === prop || path.startsWith(prop + '.')) {
					part.updatePath(state, prop, immediate)
					break
				}
			}
		})
	}

	updatePath(path, immediate) {
		if (!this.host) {
			return
		}
		let state = this._getState()
		this.parts.forEach((part) => {
			if (part.relatedPaths.has(path)) {
				part.updatePath(state, path, immediate)
			}
		})
	}
}