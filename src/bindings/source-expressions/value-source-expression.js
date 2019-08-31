import {SourceExpression} from './source-expression.js'
import {varNameRegex} from './regex.js'

export class ValueSourceExpression extends SourceExpression {
	static parse(text) {
		let value
		let match = /^[0-9]+(?:\.[0-9]+)?$/.exec(text)

		if (text === 'true' || text === 'false') {
			match = true
			value = text === 'true'
		}
		else if (match) {
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
		this.relatedPaths = new Set
	}

	setValue(states, value) {
		this.value = this.negateValueIfNeeded(value)
	}

	getValue(states) {
		return this.negateValueIfNeeded(this.value)
	}
}