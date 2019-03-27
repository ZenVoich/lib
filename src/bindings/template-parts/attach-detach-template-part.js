import TemplatePart from './template-part.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'

export default class AttachDetachTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (!['#attach-if', '#detach-if'].includes(attribute)) {
			return
		}

		let sourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))[0]
		template.removeAttribute(attribute)

		let childTemplateRootSkeleton = TemplateRoot.parseSkeleton(template)

		return {
			type: attribute.slice(1, -3),
			sourceExpression,
			childTemplateRootSkeleton,
			relatedProps: new Set([
				...sourceExpression.getRelatedProps(),
				...TemplateRoot.fromSkeleton(childTemplateRootSkeleton).getRelatedProps()
			]),
		}
	}

	static fromSkeleton(skeleton, template) {
		let childTemplateRoot = TemplateRoot.fromSkeleton(skeleton.childTemplateRootSkeleton, template)
		let part = new AttachDetachTemplatePart(template)
		part.type = skeleton.type
		part.sourceExpression = skeleton.sourceExpression
		part.childTemplateRoot = childTemplateRoot
		part.relatedProps = skeleton.relatedProps
		return part
	}

	host = null
	type = '' // attach | detach
	comment = new Comment
	element = null
	childTemplateRoot = null
	sourceExpression = null
	relatedProps = null

	constructor(template) {
		super()
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

	update(state, immediate) {
		if (immediate) {
			this._render(state)
		}
		else {
			requestRender(this.host, this, () => {
				this._render(state)
			})
		}

		if (this._shouldAttach(state)) {
			this.childTemplateRoot.update(state, immediate)
		}
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

		if (this._shouldAttach(state)) {
			this.childTemplateRoot.updateProp(state, prop, immediate)
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
		return this.relatedProps
	}
}