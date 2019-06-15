import {SourceExpression} from './source-expression.js'
import {varName} from './regex.js'
import {parse as parseSourceExpression} from './source-expression-parser.js'

let argRegexStr = `(?:!?${varName}(?:\\.${varName})*|'[^']*'|[0-9]+)`
let argRegex = new RegExp(`${argRegexStr}`, 'ig')
let regex = new RegExp(`^(${varName})\\((${argRegexStr}(?:\\s*,\\s*${argRegexStr})*)?\\)$`, 'ig')

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

	getValue(state) {
		if (typeof state[this.functionName] !== 'function') {
			throw `there is no function '${this.functionName}'`
		}
		let value = state[this.functionName](...this.args.map(expr => expr.getValue(state)))
		return this.negateValueIfNeeded(value)
	}
}