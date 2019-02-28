import {parse as parseTemplateParts} from './template-parts/template-part-parser.js'

export class Template {
	parts = []
	host = null
	state = null

	#propertiesObserver = (prop) => {
		this.updateProp(prop)
	}

	constructor(root) {
		this.parts = parseTemplateParts(root)
	}

	connect(host, state) {
		this.host = host
		this.state = state || host
		this.parts.forEach((part) => {
			part.connect(host, state)
		})
	}

	disconnect() {
		this.host = null
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

	update() {
		this.parts.forEach((part) => {
			part.update(this.state, this.host)
		})
	}

	updateProp(prop) {
		this.parts.forEach((part) => {
			part.updateProp(this.state, this.host, prop)
		})
	}

	clone() {
		let template = new Template
		template.parts = this.parts.map((part) => {
			return part.clone()
		})
		if (this.host) {
			template.connect(this.host)
		}
	}
}