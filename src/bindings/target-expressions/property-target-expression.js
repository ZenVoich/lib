import {toCamelCase} from '../../helpers.js'
import TargetExpression from './target-expression.js'

export default class PropertyTargetExpression extends TargetExpression {
	static parseType = 'attribute'
	static updatePhase = 'microtask'

	static parse(element, attribute) {
		if (!attribute.startsWith('.')) {
			return
		}
		let target = new PropertyTargetExpression
		target.element = element
		target.propertyName = toCamelCase(attribute.slice(1))

		if (target.propertyName === 'innerHtml' || target.propertyName === 'innerhtml') {
			target.propertyName = 'innerHTML'
		}
		return target
	}

	element = null
	propertyName = ''

	setValue(value) {
		this.element[this.propertyName] = value
	}

	getValue() {
		return this.element[this.propertyName]
	}
}