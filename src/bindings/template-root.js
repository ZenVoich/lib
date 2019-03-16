import {parse as parseTemplateParts} from './template-parser.js'

export class TemplateRoot {
	parts = []

	constructor(template) {
		this.originalTemplate = template.cloneNode(true)
		this.template = template
		this.parts = parseTemplateParts(template)
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

	update(state) {
		// host render domain
		this.parts.forEach((part) => {
			part.update(state)
		})
	}

	updateProp(state, prop) {
		this.parts.forEach((part) => {
			part.updateProp(state, prop)
		})
	}

	clone() {
		return new TemplateRoot(this.originalTemplate.cloneNode(true))
	}
}