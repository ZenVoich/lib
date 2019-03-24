import TemplatePart from './template-part.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'

export default class ShowHideTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (!['#show-if', '#hide-if'].includes(attribute)) {
			return
		}

		let sourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))[0]
		template.removeAttribute(attribute)

		let childTemplateRootSkeleton = TemplateRoot.parseSkeleton(template)

		return {
			type: attribute.slice(1, -3),
			sourceExpression: sourceExpression,
			childTemplateRootSkeleton: TemplateRoot.parseSkeleton(template),
			relatedProps: new Set([
				...sourceExpression.getRelatedProps(),
				...TemplateRoot.fromSkeleton(childTemplateRootSkeleton).getRelatedProps()
			]),
		}
	}

	static fromSkeleton(skeleton, template) {
		let childTemplateRoot = TemplateRoot.fromSkeleton(skeleton.childTemplateRootSkeleton, template)
		let part = new ShowHideTemplatePart(template)
		part.type = skeleton.type
		part.sourceExpression = skeleton.sourceExpression
		part.childTemplateRoot = childTemplateRoot
		part.relatedProps = skeleton.relatedProps
		return part
	}

	host = null
	type = '' // show | hide
	element = null
	childTemplateRoot = null
	sourceExpression = null
	relatedProps = null

	constructor(template) {
		super()
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

	update(state, immediate) {
		if (immediate) {
			this._render(state)
		}
		else {
			requestRender(this.host, this, () => {
				this._render(state)
			})
		}
		this.childTemplateRoot.update(state, immediate)
	}

	updateProp(state, prop, immediate) {
		if (immediate) {
			this._render(state)
		}
		else {
			requestRender(this.host, this, () => {
				this._render(state)
			})
		}
		this.childTemplateRoot.updateProp(state, prop, immediate)
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
		return this.relatedProps
	}
}