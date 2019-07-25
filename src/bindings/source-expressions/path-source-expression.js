import {SourceExpression} from './source-expression.js'
import {varNameRegex, pathPartRegex} from './regex.js'

let regex = new RegExp(`^(${varNameRegex}(?:\\.${pathPartRegex})+)$`, 'ig')

export class PathSourceExpression extends SourceExpression {
	static parse(text) {
		let match = regex.exec(text)
		regex.lastIndex = 0

		if (match) {
			return new PathSourceExpression({path: match[1].split('.'), pathStr: match[1]})
		}
	}

	path = []

	constructor({path, pathStr} = {}) {
		super()
		this.path = path
		this.relatedPaths = new Set([pathStr])
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

		object[this.path[this.path.length - 1]] = this.negateValueIfNeeded(value)
	}

	getValue(state) {
		let value = state

		for (let [index, prop] of this.path.entries()) {
			if (!value[prop] && index !== this.path.length - 1) {
				return this.negateValueIfNeeded()
			}
			value = value[prop]
		}

		return this.negateValueIfNeeded(value)
	}
}