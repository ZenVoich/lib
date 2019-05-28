import {TemplatePart} from './template-part.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'

export class ShowHideTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (!['#show-if', '#hide-if'].includes(attribute)) {
			return
		}

		let sourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))
		template.removeAttribute(attribute)

		let childTemplateRootSkeleton = TemplateRoot.parseSkeleton(template)

		return {
			type: attribute.slice(1, -3),
			sourceExpression,
			childTemplateRootSkeleton,
			relatedPaths: sourceExpression.relatedPaths,
		}
	}

	static fromSkeleton(skeleton, template) {
		let childTemplateRoot = TemplateRoot.fromSkeleton(skeleton.childTemplateRootSkeleton, template)
		let part = new ShowHideTemplatePart(template)
		part.type = skeleton.type
		part.sourceExpression = skeleton.sourceExpression
		part.childTemplateRoot = childTemplateRoot
		part.relatedPaths = skeleton.relatedPaths
		return part
	}

	host
	relatedPaths

	type // show | hide
	shown

	element
	childTemplateRoot
	sourceExpression

	constructor(template) {
		super()
		this.element = template.content.firstElementChild
		template.replaceWith(this.element)
		this.shown = true
	}

	connect(host) {
		this.host = host
		this.childTemplateRoot.connect(host)
		this.childTemplateRoot.update(this.host, true)
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
	}

	updatePath(state, path, immediate) {
		if (immediate) {
			this._render(state)
		}
		else {
			requestRender(this.host, this, () => {
				this._render(state)
			})
		}
	}

	_render(state) {
		let value = this.sourceExpression.getValue(state)
		let show = this.type === 'show' ? !!value : !value

		if (this.shown === show) {
			return
		}
		this.shown = show

		if (show) {
			this.element.style.removeProperty('display')
		}
		else {
			this.element.style.setProperty('display', 'none', 'important')
		}
	}
}