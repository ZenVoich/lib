import {parseSkeleton, fromSkeleton} from './template-parser.js'
import {observeHostProperty} from '../utils/property-observer.js'
import {observe} from '../data-flow/observer.js'

export class TemplateRoot {
	host
	relatedPaths
	parts = []
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

		if (!skeleton.relatedPaths) {
			let relatedPaths = new Set
			templateRoot.parts.forEach((part) => {
				part.relatedPaths.forEach((path) => {
					relatedPaths.add(path)
				})
			})
			skeleton.relatedPaths = relatedPaths
		}
		templateRoot.relatedPaths = skeleton.relatedPaths

		return templateRoot
	}

	static parse(template) {
		return this.fromSkeleton(this.parseSkeleton(template))
	}

	get content() {
		return this.template.content
	}

	connect(host, ok = true, dirtyCheck = false) {
		this.host = host
		this.parts.forEach((part) => {
			part.connect(host, {dirtyCheck})
		})

		if (!ok) {
			return
		}

		if (dirtyCheck) {
			this.#unobservers = [...this.relatedPaths].map((path) => {
				let prop = path.split('.')[0]
				return observeHostProperty(host, prop, (oldVal, newVal) => {
					this.updateProp(host, prop)
				})
			})
		}
		else {
			this.#unobservers = [...this.relatedPaths].map((path) => {
				return observe(host, path, (oldVal, newVal) => {
					this.updatePath(host, path)
				})
			})
		}
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

	update(state, immediate) {
		if (!this.host) {
			return
		}
		this.parts.forEach((part) => {
			part.update(state, immediate)
		})
	}

	updateProp(state, prop, immediate) {
		if (!this.host) {
			return
		}
		this.parts.forEach((part) => {
			for (let path of part.relatedPaths) {
				if (path.startsWith(prop + '.')) {
					part.updatePath(state, prop, immediate)
					break
				}
			}
		})
	}

	updatePath(state, path, immediate) {
		if (!this.host) {
			return
		}
		this.parts.forEach((part) => {
			if (part.relatedPaths.has(path)) {
				part.updatePath(state, path, immediate)
			}
		})
	}
}