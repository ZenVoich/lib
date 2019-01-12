import SourceExpression from './source-expression.js'
import {varName} from './regex.js'
import {parse as parseSourceExpression} from './source-expression-parser.js'

export default class CallSourceExpression extends SourceExpression {
	static parse(text) {
		let arg = `(${varName}(?:\\.${varName})*|'[^']*'|[0-9]+)`
		let match = new RegExp(`^(${varName})\\(${arg}(?:\\s*,\\s*${arg})*\\)$`, 'ig').exec(text)
		if (match) {
			let [_, fn, ...args] = match;
			args = args.map((arg) => {
				return parseSourceExpression(arg)
			})
			return new CallSourceExpression({functionName: fn, args: args})
		}
	}

	functionName = ''
	args = [] // [SourceExpression]

	constructor({functionName, args} = {}) {
		super()
		this.functionName = functionName
		this.args = args
	}

	getValue(state) {
		return state[this.functionName](...this.args.map(expr => expr.getValue(state)))
	}

	getRelatedProps() {
		let props = new Set
		this.args.forEach((expr) => {
			expr.getRelatedProps().forEach((prop) => {
				props.add(prop)
			})
		})
		return props
	}

	isPropRelated(prop) {
		return this.args.some((expr) => {
			return expr.isPropRelated(prop)
		})
	}
}