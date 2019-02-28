import TemplatePart from './template-part.js'
import {Template} from '../template.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'

export default class AttachDetachTemplatePart extends TemplatePart {
	static parse(element, attribute) {
		if (!['#attach-if', '#detach-if'].includes(attribute)) {
			return
		}
		let sourceExpression = parseSourceExpressionMemoized(element.getAttribute(attribute))[0]
		element.removeAttribute('#attach-if')
		element.removeAttribute('#detach-if')

		let part = new AttachDetachTemplatePart(element)
		part.type = attribute.slice(1, -3)
		part.sourceExpression = sourceExpression
		return part
	}

	comment = new Comment
	element = null
	childTemplate = null
	sourceExpression = null
	type = ''

	constructor(element) {
		super()
		this.element = element
		this.element.replaceWith(this.comment)
		this.childTemplate = new Template(this.element)
	}

	connect(host, state) {
		this.childTemplate.connect(host, state)
	}

	update(state, host) {
		this._render(state)

		if (this.element.isConnected) {
			this.childTemplate.update()
		}
	}

	updateProp(state, host, prop) {
		this._render(state)

		if (this.element.isConnected) {
			this.childTemplate.updateProp(prop)
		}
	}

	_render(state) {
		let value = this.sourceExpression.getValue(state)
		let attach = this.type === 'attach' ? !!value : !value

		if (attach && !this.element.isConnected) {
			this.comment.replaceWith(this.element)
		}
		else if (!attach && this.element.isConnected) {
			this.element.replaceWith(this.comment)
		}
	}

	getRelatedProps() {
		let props = new Set
		return new Set([...this.sourceExpression.getRelatedProps(), ...this.childTemplate.getRelatedProps()])
	}
}