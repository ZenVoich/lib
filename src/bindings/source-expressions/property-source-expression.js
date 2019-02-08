import SourceExpression from './source-expression.js'
import {varName} from './regex.js'

export default class PropertySourceExpression extends SourceExpression {
	static parse(text) {
		let match = new RegExp(`^(${varName})$`, 'ig').exec(text)

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