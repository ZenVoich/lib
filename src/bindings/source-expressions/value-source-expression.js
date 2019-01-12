import SourceExpression from './source-expression.js'
import {varName} from './regex.js'

export default class ValueSourceExpression extends SourceExpression {
	static parse(text) {
		let value
		let match
		match = /^[0-9]+(?:\.[0-9]+)?$/.exec(text)
		if (match) {
			value = parseFloat(text)
		}
		else {
			match = /^'([^']*)'$/.exec(text)
			if (match) {
				value = match[1]
			}
		}
		if (match) {
			return new ValueSourceExpression({value: value})
		}
	}

	value = null

	constructor({value} = {}) {
		super()
		this.value = value
	}

	setValue(state, value) {
		this.value = value
	}

	getValue(state) {
		return this.value
	}

	getRelatedProps() {
		return new Set
	}

	isPropRelated(prop) {
		return false
	}
}