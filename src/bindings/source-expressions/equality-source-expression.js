import {SourceExpression} from './source-expression.js'
import {valueRegex} from './regex.js'
import {parse as parseSourceExpression} from './source-expression-parser.js'

let regex = new RegExp(`^\\s*(${valueRegex})\\s*(===?|!==?|>=?|<=?)\\s*(${valueRegex})\\s*$`, 'ig')

export class EqualitySourceExpression extends SourceExpression {
	static parse(text) {
		let match = regex.exec(text)
		regex.lastIndex = 0

		if (match) {
			let [leftExpr, rightExpr] = [match[1], match[3]].map((arg) => {
				let negate = false
				if (arg[0] === '!') {
					negate = true
					arg = arg.slice(1)
				}
				return parseSourceExpression(arg, {negate})
			})

			return new EqualitySourceExpression({leftExpr, operator: match[2], rightExpr})
		}
	}

	leftExpr // SourceExpression
	operator = ''
	rightExpr // SourceExpression

	constructor({leftExpr, operator, rightExpr} = {}) {
		super()
		this.leftExpr = leftExpr
		this.operator = operator
		this.rightExpr = rightExpr

		this.relatedPaths = new Set([...leftExpr.relatedPaths, ...rightExpr.relatedPaths])
	}

	getValue(state) {
		let leftValue = this.leftExpr.getValue(state)
		let rightValue = this.rightExpr.getValue(state)

		if (this.operator === '==') {
			return leftValue == rightValue
		}
		if (this.operator === '===') {
			return leftValue === rightValue
		}
		if (this.operator === '!=') {
			return leftValue != rightValue
		}
		if (this.operator === '!==') {
			return leftValue !== rightValue
		}
		if (this.operator === '<') {
			return leftValue < rightValue
		}
		if (this.operator === '>') {
			return leftValue > rightValue
		}
		if (this.operator === '<=') {
			return leftValue <= rightValue
		}
		if (this.operator === '>=') {
			return leftValue >= rightValue
		}
	}
}