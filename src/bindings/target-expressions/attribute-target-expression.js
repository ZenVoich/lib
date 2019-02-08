import TargetExpression from './target-expression.js'

export default class AttributeTargetExpression extends TargetExpression {
	static parsePriority = 1
	static parseType = 'attribute'
	static updatePhase = 'animationFrame'

	static parse(element, attribute) {
		// todo: remove
		// if (!attribute.endsWith('$')) {
		// 	return
		// }

		let target = new AttributeTargetExpression
		target.element = element
		target.attributeName = attribute
		return target
	}

	element = null
	attributeName = ''

	setValue(value) {
		if (value === undefined || value === null || value === false) {
			this.element.removeAttribute(this.attributeName)
		} else {
			this.element.setAttribute(this.attributeName, value)
		}
	}

	getValue() {
		return this.element.getAttribute(this.attributeName)
	}
}