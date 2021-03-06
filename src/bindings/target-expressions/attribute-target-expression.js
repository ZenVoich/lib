import {TargetExpression} from './target-expression.js'

export class AttributeTargetExpression extends TargetExpression {
	static parsePrecedence = 0 // parse last
	static parseType = 'attribute'
	static updatePhase = 'render'

	static parseSkeleton(attribute) {
		if (attribute[0] === '#') {
			return
		}
		return {
			attributeName: attribute,
		}
	}

	#element = null
	#attributeName = ''

	constructor({attributeName}, element) {
		super()
		this.#element = element
		this.#attributeName = attributeName
	}

	setValue(value) {
		if (value === undefined || value === null || value === false) {
			this.#element.removeAttribute(this.#attributeName)
		}
		else if (value === true) {
			this.#element.setAttribute(this.#attributeName, '')
		}
		else if (this.#element.getAttribute(this.#attributeName) !== value) {
			this.#element.setAttribute(this.#attributeName, value === true ? '' : value)
		}
	}

	getValue() {
		return this.#element.getAttribute(this.#attributeName)
	}
}