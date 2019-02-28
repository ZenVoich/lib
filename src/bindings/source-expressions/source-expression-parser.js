import ValueSourceExpression from './value-source-expression.js'
import PropertySourceExpression from './property-source-expression.js'
import PathSourceExpression from './path-source-expression.js'
import CallSourceExpression from './call-source-expression.js'

let sourceExprClasses = [
	CallSourceExpression,
	PathSourceExpression,
	PropertySourceExpression,
	ValueSourceExpression,
]

export let parse = (text, {negate = false} = {}) => {
	let expr
	sourceExprClasses.find((exprClass) => {
		expr = exprClass.parse(text)
		return expr
	})
	if (expr) {
		expr.negate = negate
	}
	return expr
}