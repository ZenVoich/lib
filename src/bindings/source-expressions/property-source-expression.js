import {SourceExpression} from './source-expression.js'
import {varNameRegex} from './regex.js'
import {findState} from './find-state.js'

let regex = new RegExp(`^(${varNameRegex})$`, 'ig')

export class PropertySourceExpression extends SourceExpression {
	static parse(text) {
		if (text === 'true' || text === 'false') {
			return
		}

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
		this.relatedPaths = new Set([propertyName])
	}

	setValue(states, value) {
		states[0][this.propertyName] = this.negateValueIfNeeded(value)
	}

	getValue(states) {
		let state = findState(states, this.propertyName)
		return this.negateValueIfNeeded(state[this.propertyName])
	}
}