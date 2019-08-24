import {SourceExpression} from './source-expression.js'
import {varNameRegex, valueRegex} from './regex.js'
import {findState} from './find-state.js'
import {parse as parseSourceExpression} from './source-expression-parser.js'

let argRegex = new RegExp(`${valueRegex}`, 'ig')
let regex = new RegExp(`^(${varNameRegex})\\((${valueRegex}(?:\\s*,\\s*${valueRegex})*)?\\)$`, 'ig')

export class CallSourceExpression extends SourceExpression {
	static parse(text) {
		let match = regex.exec(text)
		regex.lastIndex = 0

		if (match) {
			let [_, fn, argsStr] = match
			let args = argsStr ? argsStr.match(argRegex) : []

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

		this.relatedPaths = new Set([functionName])
		args.forEach((expr) => {
			expr.relatedPaths.forEach((path) => {
				this.relatedPaths.add(path)
			})
		})
	}

	getValue(states) {
		let state = findState(states, this.functionName)

		if (typeof state[this.functionName] !== 'function') {
			throw `there is no function '${this.functionName}'`
		}
		let value = state[this.functionName](...this.args.map(expr => expr.getValue(states)))
		return this.negateValueIfNeeded(value)
	}
}