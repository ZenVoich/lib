import TemplatePart from './template-part.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'

export default class AttachDetachTemplatePart extends TemplatePart {
	static parse(template, attribute) {
		if (!['#attach-if', '#detach-if'].includes(attribute)) {
			return
		}
		let sourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))[0]
		template.removeAttribute(attribute)

		let part = new AttachDetachTemplatePart(template)
		part.type = attribute.slice(1, -3)
		part.sourceExpression = sourceExpression
		return part
	}

	host = null
	type = '' // attach | detach
	comment = new Comment
	element = null
	childTemplateRoot = null
	sourceExpression = null

	constructor(template) {
		super()
		template = template
		this.childTemplateRoot = new TemplateRoot(template)
		this.element = template.content.firstElementChild
		template.replaceWith(this.comment)
	}

	connect(host) {
		this.host = host
		this.childTemplateRoot.connect(host)
	}

	disconnect() {
		this.host = null
		this.childTemplateRoot.disconnect()
	}

	update(state) {
		requestRender(this.host, this, () => {
			this._render(state)
		})

		if (this._shouldAttach(state)) {
			this.childTemplateRoot.update(state)
		}
	}

	updateProp(state, prop) {
		requestRender(this.host, this, () => {
			this._render(state)
		})

		if (this._shouldAttach(state)) {
			this.childTemplateRoot.updateProp(state, prop)
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
		return new Set([...this.sourceExpression.getRelatedProps(), ...this.childTemplateRoot.getRelatedProps()])
	}
}