import {parse as parseTemplateParts} from './template-parts/template-part-parser.js'

export class Template {
	parts = []

	constructor(root) {
		this.parts = parseTemplateParts(root)
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
}