import {TemplatePart} from './template-part.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {pub} from '../../utils/pub-sub.js'

export class ShowHideTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (!['#show', '#hide'].includes(attribute)) {
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
	#type // show | hide
	#shown

	#template
	#element
	#childTemplateRoot
	#sourceExpression

	constructor({type, sourceExpression, childTemplateRootSkeleton, relatedPaths}, template) {
		super()

		this.#template = template
		this.#type = type
		this.#sourceExpression = sourceExpression
		this.#childTemplateRoot = new TemplateRoot(childTemplateRootSkeleton, template)
		this.relatedPaths = relatedPaths

		this.#element = template.content.firstElementChild
		this.#shown = true

		template.replaceWith(this.#element)

		requestAnimationFrame(() => {
			this.firstRendered = true
		})
	}

	connect(host) {
		this.#host = host
		this.#childTemplateRoot.contextStates = this.parentTemplateRoot.contextStates
		this.#childTemplateRoot.connect(host)
		this.#childTemplateRoot.update()
		this.#childTemplateRoot.render()
	}

	disconnect() {
		this.#host = null
		this.#childTemplateRoot.disconnect()
	}

	async render(state) {
		let value = this.#sourceExpression.getValue(state)
		let show = this.#type === 'show' ? !!value : !value

		if (this.#shown === show) {
			return
		}
		this.#shown = show

		if (show) {
			this.#element.style.removeProperty('display')
			if (this.firstRendered) {
				pub(this.#template, 'intro', {simpleMode: true, element: this.#element})
			}
		}
		else {
			if (this.firstRendered) {
				await pub(this.#template, 'outro', {simpleMode: true, element: this.#element})
			}
			this.#element.style.setProperty('display', 'none', 'important')
		}
	}
}