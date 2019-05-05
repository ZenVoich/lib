import TemplatePart from './template-part.js'
import {FragmentContainer} from './fragment-container.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'
import {pub} from '../../utils/pub-sub.js'

export default class AttachDetachTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (!['#attach-if', '#detach-if'].includes(attribute)) {
			return
		}

		let sourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))
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
		let part = new AttachDetachTemplatePart(template)
		part.type = skeleton.type
		part.sourceExpression = skeleton.sourceExpression
		part.childTemplateRoot = TemplateRoot.fromSkeleton(skeleton.childTemplateRootSkeleton, template)
		part.relatedProps = skeleton.relatedProps
		return part
	}

	host = null
	type = '' // attach | detach
	comment = new Comment
	template = null
	fragmentContainer = null
	childTemplateRoot = null
	sourceExpression = null
	relatedProps = null

	constructor(template) {
		super()
		this.template = template
		this.fragmentContainer = new FragmentContainer(template.content)
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
			this._render(state, immediate)
		}
		else {
			requestRender(this.host, this, () => {
				this._render(state, immediate)
			})
		}

		if (this._shouldAttach(state)) {
			this.childTemplateRoot.update(state, immediate)
		}
	}

	updateProp(state, prop, immediate) {
		if (immediate) {
			this._render(state, immediate)
		}
		else {
			requestRender(this.host, this, () => {
				this._render(state, immediate)
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

	async _render(state, immediate) {
		let attach = this._shouldAttach(state)

		if (attach) {
			if (!this.fragmentContainer.isConnected) {
				this.comment.replaceWith(this.fragmentContainer.content)
			}
			if (!immediate) {
				pub(this.template, 'intro')
			}
		}
		else if (!attach && this.fragmentContainer.isConnected) {
			if (!immediate) {
				await pub(this.template, 'outro').then((ok) => {

				})
			}
			if (this.fragmentContainer.isConnected) {
				this.fragmentContainer.replaceWith(this.comment)
			}
		}
	}

	getRelatedProps() {
		return this.relatedProps
	}
}