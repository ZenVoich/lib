import {toCamelCase} from '../../utils/case.js'
import {TargetExpression} from './target-expression.js'

export class PropertyTargetExpression extends TargetExpression {
	static parseType = 'attribute'
	static updatePhase = 'microtask'

	static parseSkeleton(attribute) {
		if (attribute[0] !== '.' && attribute[0] !== ':') {
			return
		}
		let propertyName = toCamelCase(attribute.slice(1))
		if (propertyName === 'innerHtml') {
			propertyName = 'innerHTML'
		}
		return {
			class: this,
			propertyName,
			twoWayBind: attribute[0] === ':',
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