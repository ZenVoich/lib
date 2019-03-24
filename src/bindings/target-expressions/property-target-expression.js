import {toCamelCase} from '../../utils/case.js'
import TargetExpression from './target-expression.js'

export default class PropertyTargetExpression extends TargetExpression {
	static parseType = 'attribute'
	static updatePhase = 'microtask'

	static parseSkeleton(element, attribute) {
		if (!attribute.startsWith('.')) {
			return
		}
		let propertyName = toCamelCase(attribute.slice(1))
		if (propertyName === 'innerHtml' || propertyName === 'innerhtml') {
			propertyName = 'innerHTML'
		}
		return {
			class: this,
			propertyName,
		}
	}

	static fromSkeleton(skeleton, element) {
		let target = new PropertyTargetExpression
		target.element = element
		target.propertyName = skeleton.propertyName
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