import TargetExpression from './target-expression.js'

export default class AttributeTargetExpression extends TargetExpression {
	static parsePrecedence = 0 // parse last
	static parseType = 'attribute'
	static updatePhase = 'animationFrame'

	static parseSkeleton(element, attribute) {
		if (attribute[0] === '#') {
			return
		}
		return {
			class: this,
			attributeName: attribute,
		}
	}

	static fromSkeleton(skeleton, element) {
		let target = new AttributeTargetExpression
		target.element = element
		target.attributeName = skeleton.attributeName
		return target
	}

	element = null
	attributeName = ''

	setValue(value) {
		if (value === undefined || value === null || value === false) {
			this.element.removeAttribute(this.attributeName)
		}
		else if (this.element.getAttribute(this.attributeName) !== value) {
			this.element.setAttribute(this.attributeName, value)
		}
	}

	getValue() {
		return this.element.getAttribute(this.attributeName)
	}
}