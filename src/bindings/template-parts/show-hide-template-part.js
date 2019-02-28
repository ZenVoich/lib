import TemplatePart from './template-part.js'
import {Template} from '../template.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'

export default class ShowHideTemplatePart extends TemplatePart {
	static parse(element, attribute) {
		if (!['#show-if', '#hide-if'].includes(attribute)) {
			return
		}
		let sourceExpression = parseSourceExpressionMemoized(element.getAttribute(attribute))[0]
		element.removeAttribute('#show-if')
		element.removeAttribute('#hide-if')

		let part = new ShowHideTemplatePart(element)
		part.type = attribute.slice(1, -3)
		part.sourceExpression = sourceExpression
		return part
	}

	type = '' // show | hide
	element = null
	childTemplate = null
	sourceExpression = null

	constructor(element) {
		super()
		this.element = element
		this.childTemplate = new Template(this.element)
	}

	connect(host) {
		this.childTemplate.connect(host)
	}

	disconnect() {
		this.childTemplate.disconnect()
	}

	update(state) {
		this._render(state)
		this.childTemplate.update(state)
	}

	updateProp(state, prop) {
		this._render(state)
		this.childTemplate.updateProp(state, prop)
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
		return new Set([...this.sourceExpression.getRelatedProps(), ...this.childTemplate.getRelatedProps()])
	}
}