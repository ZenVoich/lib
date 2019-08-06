import {TargetExpression} from './target-expression.js'

export class AttributeValuePartTargetExpression extends TargetExpression {
	static parseType = 'attribute'
	static updatePhase = 'render'

	static parseSkeleton(attribute) {
		if (!attribute.includes('|')) {
			return
		}

		let [attr, value] = attribute.split('|')

		if (attr !== 'class' && attr !== 'style') {
			console.error(`Attribute value part expression can only be applied to the 'class' or 'style' attribute: ${attribute}`)
			return
		}

		return {
			attributeName: attr,
			attributeValuePart: value,
		}
	}

	#element = null
	#attributeName = ''
	#attributeValuePart = ''

	constructor({attributeName, attributeValuePart}, element) {
		super()
		this.#element = element
		this.#attributeName = attributeName
		this.#attributeValuePart = attributeValuePart
	}

	setValue(value) {
		if (this.#attributeName === 'class') {
			this.#element.classList.toggle(this.#attributeValuePart, !!value)
			return
		}

		if (this.#attributeName === 'style') {
			this.#element.style[this.#attributeValuePart] = value
			return
		}

		let attrVal = this.#element.getAttribute(this.#attributeName) || ''
		let parts = attrVal.split(' ').filter(a => a)
		let index = parts.indexOf(this.#attributeValuePart)

		if (index !== -1) {
			parts.splice(index, 1)

			if (!parts.length) {
				this.#element.removeAttribute(this.#attributeName)
				return
			}
		}
		else {
			parts.push(this.#attributeValuePart)
		}

		this.#element.setAttribute(this.#attributeName, parts.join(' '))
	}

	getValue() {
		return this.#element.getAttribute(this.#attributeName)
	}
}