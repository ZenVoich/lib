import SourceExpression from './source-expression.js'
import {varName} from './regex.js'

export default class PathSourceExpression extends SourceExpression {
	static parse(text) {
		let match = new RegExp(`^(${varName}(?:\\.${varName})+)$`, 'ig').exec(text)
		if (match) {
			return new PathSourceExpression({path: match[1].split('.')})
		}
	}

	path = []

	constructor({path} = {}) {
		super()
		this.path = path
	}

	setValue(state, value) {
		let path = this.path.slice(0, -1)
		let object = state
		for (let prop of path) {
			if (!object[prop]) {
				return
			}
			object = object[prop]
		}
		object[this.path[this.path.length - 1]] = value
	}

	getValue(state) {
		let value = state
		for (let prop of this.path) {
			if (!value[prop]) {
				return
			}
			value = value[prop]
		}
		return value
	}

	getRelatedProps() {
		return new Set([this.path[0]])
	}

	isPropRelated(prop) {
		return prop == this.path[0]
	}
}