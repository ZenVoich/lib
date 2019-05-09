import {SourceExpression} from './source-expression.js'
import {varName} from './regex.js'

let regex = new RegExp(`^(${varName})$`, 'ig')

export class PropertySourceExpression extends SourceExpression {
	static parse(text) {
		let match = regex.exec(text)
		regex.lastIndex = 0

		if (match) {
			return new PropertySourceExpression({propertyName: match[1]})
		}
	}

	propertyName = ''

	constructor({propertyName} = {}) {
		super()
		this.propertyName = propertyName
	}

	setValue(state, value) {
		state[this.propertyName] = this.negateValueIfNeeded(value)
	}

	getValue(state) {
		return this.negateValueIfNeeded(state[this.propertyName])
	}

	getRelatedProps() {
		return new Set([this.propertyName])
	}

	isPropRelated(prop) {
		return prop === this.propertyName
	}
}