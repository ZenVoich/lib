import {parseSkeleton, fromSkeleton} from './template-parser.js'

export class TemplateRoot {
	parts = []

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

	connect(host) {
		this.parts.forEach((part) => {
			part.connect(host)
		})
	}

	disconnect() {
		this.parts.forEach((part) => {
			part.disconnect()
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