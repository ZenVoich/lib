import SourceExpression from './source-expression.js'
import {varName} from './regex.js'
import {parse as parseSourceExpression} from './source-expression-parser.js'

export default class CallSourceExpression extends SourceExpression {
	static parse(text) {
		let argRegex = `(?:!?${varName}(?:\\.${varName})*|'[^']*'|[0-9]+)`
		let match = new RegExp(`^(${varName})\\((${argRegex}(?:\\s*,\\s*${argRegex})*)\\)$`, 'ig').exec(text)

		if (match) {
			let [_, fn, argsStr] = match
			let args = argsStr.match(new RegExp(`${argRegex}`, 'ig'))

			args = args.map((arg) => {
				let negate = false
				if (arg[0] === '!') {
					negate = true
					arg = arg.slice(1)
				}
				return parseSourceExpression(arg, {negate})
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
		let value = state[this.functionName](...this.args.map(expr => expr.getValue(state)))
		return this.negateValueIfNeeded(value)
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