import {parseSkeleton, fromSkeleton} from './template-parser.js'
import {observeHostProperty, unobserveHostProperty} from '../utils/property-observer.js'

export class TemplateRoot {
	parts = []
	host = null
	#unobserveList = []

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
		return templateRoot
	}

	static parse(template) {
		return this.fromSkeleton(this.parseSkeleton(template))
	}

	get content() {
		return this.template.content
	}

	connect(host, ok) {
		this.host = host
		this.parts.forEach((part) => {
			part.connect(host)
		})

		if (ok) {
			this.#unobserveList = [...this.getRelatedProps()].map((prop) => {
				return observeHostProperty(host, prop, (oldVal, newVal) => {
					this.updateProp(host, prop)
				})
			})
		}
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

	getRelatedProps() {
		let props = new Set
		this.parts.forEach((part) => {
			part.getRelatedProps().forEach((prop) => {
				props.add(prop)
			})
		})
		return props
	}

	update(state, immediate) {
		this.parts.forEach((part) => {
			part.update(state, immediate)
		})
	}

	updateProp(state, prop, immediate) {
		this.parts.forEach((part) => {
			part.updateProp(state, prop, immediate)
		})
	}
}