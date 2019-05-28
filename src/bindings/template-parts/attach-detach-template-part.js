import {TemplatePart} from './template-part.js'
import {FragmentContainer} from './fragment-container.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'
import {pub} from '../../utils/pub-sub.js'

export class AttachDetachTemplatePart extends TemplatePart {
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
			relatedPaths: sourceExpression.relatedPaths,
		}
	}

	static fromSkeleton(skeleton, template) {
		let part = new AttachDetachTemplatePart(template)
		part.type = skeleton.type
		part.sourceExpression = skeleton.sourceExpression
		part.childTemplateRoot = TemplateRoot.fromSkeleton(skeleton.childTemplateRootSkeleton, template)
		part.relatedPaths = skeleton.relatedPaths
		return part
	}

	host
	relatedPaths

	type // attach | detach
	attached
	comment = new Comment
	template

	fragmentContainer
	childTemplateRoot
	sourceExpression

	constructor(template) {
		super()
		this.template = template
		this.fragmentContainer = new FragmentContainer(template.content)
		template.replaceWith(this.comment)
		this.attached = false
	}

	connect(host) {
		this.host = host
		this._render(host, true)
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
	}

	updatePath(state, path, immediate) {
		if (immediate) {
			this._render(state, immediate)
		}
		else {
			requestRender(this.host, this, () => {
				this._render(state, immediate)
			})
		}
	}

	_shouldAttach(state) {
		let value = this.sourceExpression.getValue(state)
		return this.type === 'attach' ? !!value : !value
	}

	async _render(state, immediate) {
		let attach = this._shouldAttach(state)

		if (this.attached == attach) {
			return
		}
		this.attached = attach

		// attach
		if (attach) {
			if (!this.fragmentContainer.isConnected) {
				this.comment.replaceWith(this.fragmentContainer.content)
				this.childTemplateRoot.connect(this.host)
				this.childTemplateRoot.update(this.host, true)
			}
			if (!immediate) {
				pub(this.template, 'intro')
			}
		}
		// detach
		else if (!attach && this.fragmentContainer.isConnected) {
			if (!immediate) {
				await pub(this.template, 'outro')
			}
			if (this.fragmentContainer.isConnected) {
				this.fragmentContainer.replaceWith(this.comment)
				this.childTemplateRoot.disconnect()
			}
		}
	}
}