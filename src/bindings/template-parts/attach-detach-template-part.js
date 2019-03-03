import TemplatePart from './template-part.js'
import {Template} from '../template.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'

export default class AttachDetachTemplatePart extends TemplatePart {
	static parse(element, attribute) {
		if (!['#attach-if', '#detach-if'].includes(attribute)) {
			return
		}
		let sourceExpression = parseSourceExpressionMemoized(element.getAttribute(attribute))[0]
		element.removeAttribute(attribute)

		let part = new AttachDetachTemplatePart(element)
		part.type = attribute.slice(1, -3)
		part.sourceExpression = sourceExpression
		return part
	}

	host = null
	type = '' // attach | detach
	comment = new Comment
	element = null
	childTemplate = null
	sourceExpression = null

	constructor(element) {
		super()
		this.element = element
		this.element.replaceWith(this.comment)
		this.childTemplate = new Template(this.element)
	}

	connect(host) {
		this.host = host
		this.childTemplate.connect(host)
	}

	disconnect() {
		this.host = null
		this.childTemplate.disconnect()
	}

	update(state) {
		requestRender(this.host, this, () => {
			this._render(state)
		})

		if (this._shouldAttach(state)) {
			this.childTemplate.update(state)
		}
	}

	updateProp(state, prop) {
		requestRender(this.host, this, () => {
			this._render(state)
		})

		if (this._shouldAttach(state)) {
			this.childTemplate.updateProp(state, prop)
		}
	}

	_shouldAttach(state) {
		let value = this.sourceExpression.getValue(state)
		return this.type === 'attach' ? !!value : !value
	}

	_render(state) {
		let attach = this._shouldAttach(state)

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