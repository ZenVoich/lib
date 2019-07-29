import {TemplatePart} from './template-part.js'
import {FragmentContainer} from './fragment-container.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {pub} from '../../utils/pub-sub.js'

export class AttachDetachTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (!['#attach', '#detach'].includes(attribute)) {
			return
		}

		let sourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))
		template.removeAttribute(attribute)

		let childTemplateRootSkeleton = TemplateRoot.parseSkeleton(template)

		return {
			type: attribute.slice(1),
			sourceExpression,
			childTemplateRootSkeleton,
			relatedPaths: sourceExpression.relatedPaths,
		}
	}

	relatedPaths

	#host
	#type // attach | detach
	#attached
	#comment = new Comment
	#template

	#fragmentContainer
	#childTemplateRoot
	#sourceExpression

	constructor({type, sourceExpression, childTemplateRootSkeleton, relatedPaths}, template) {
		super()
		this.#template = template
		this.#type = type
		this.#sourceExpression = sourceExpression
		this.#childTemplateRoot = new TemplateRoot(childTemplateRootSkeleton, template)
		this.relatedPaths = relatedPaths

		this.#fragmentContainer = new FragmentContainer(template.content)
		this.#attached = false

		template.replaceWith(this.#comment)

		requestAnimationFrame(() => {
			this.firstRendered = true
		})
	}

	connect(host) {
		this.#host = host
		this.#childTemplateRoot.contextStates = [...this.parentTemplateRoot.contextStates, ...this.#childTemplateRoot.contextStates]
		this.render(this.parentTemplateRoot._getState())
	}

	disconnect() {
		this.#host = null
		this.#childTemplateRoot.disconnect()
	}

	_connectChildTemplateRoot() {
		if (!this.#childTemplateRoot.isConnected) {
			this.#childTemplateRoot.connect(this.#host)
			this.#childTemplateRoot.update()
			this.#childTemplateRoot.render()
		}
	}

	async render(state) {
		let value = this.#sourceExpression.getValue(state)
		let attach = this.#type === 'attach' ? !!value : !value

		if (this.#attached == attach) {
			if (attach) {
				this._connectChildTemplateRoot();
			}
			return
		}
		this.#attached = attach

		// attach
		if (attach) {
			if (!this.#fragmentContainer.isConnected) {
				this.#comment.replaceWith(this.#fragmentContainer.content)
			}
			this._connectChildTemplateRoot();

			if (this.firstRendered) {
				pub(this.#template, 'intro', this.#fragmentContainer)
			}
		}
		// detach
		else if (!attach && this.#fragmentContainer.isConnected) {
			if (this.firstRendered) {
				await pub(this.#template, 'outro', this.#fragmentContainer)
			}
			if (this.#fragmentContainer.isConnected) {
				this.#fragmentContainer.replaceWith(this.#comment)
			}
			if (this.#childTemplateRoot.isConnected) {
				this.#childTemplateRoot.disconnect()
			}
		}
	}
}