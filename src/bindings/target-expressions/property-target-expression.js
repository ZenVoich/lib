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
			propertyName,
			twoWayBind: attribute[0] === ':',
		}
	}

	element = null
	propertyName = ''

	constructor({propertyName}, element) {
		super()
		this.element = element
		this.propertyName = propertyName
	}

	setValue(value) {
		this.element[this.propertyName] = value
	}

	getValue() {
		return this.element[this.propertyName]
	}
}