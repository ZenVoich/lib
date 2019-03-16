import TemplatePart from './template-part.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'

export default class ShowHideTemplatePart extends TemplatePart {
	static parse(template, attribute) {
		if (!['#show-if', '#hide-if'].includes(attribute)) {
			return
		}
		let sourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))[0]
		template.removeAttribute(attribute)

		let part = new ShowHideTemplatePart(template)
		part.type = attribute.slice(1, -3)
		part.sourceExpression = sourceExpression
		return part
	}

	host = null
	type = '' // show | hide
	element = null
	childTemplateRoot = null
	sourceExpression = null

	constructor(template) {
		super()
		this.childTemplateRoot = new TemplateRoot(template)
		this.element = template.content.firstElementChild
		template.replaceWith(this.element)
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
		// requestRender(this.host, this, () => {
			this._render(state)
		// })
		this.childTemplateRoot.update(state)
	}

	updateProp(state, prop) {
		// requestRender(this.host, this, () => {
			this._render(state)
		// })
		this.childTemplateRoot.updateProp(state, prop)
	}

	_render(state) {
		let value = this.sourceExpression.getValue(state)
		let show = this.type === 'show' ? !!value : !value

		if (show) {
			this.element.style.removeProperty('display')
		}
		else {
			this.element.style.setProperty('display', 'none', 'important')
		}
	}

	getRelatedProps() {
		let props = new Set
		return new Set([...this.sourceExpression.getRelatedProps(), ...this.childTemplateRoot.getRelatedProps()])
	}
}