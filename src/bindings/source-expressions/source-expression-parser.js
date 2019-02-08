import ValueSourceExpression from './value-source-expression.js'
import PropertySourceExpression from './property-source-expression.js'
import PathSourceExpression from './path-source-expression.js'
import CallSourceExpression from './call-source-expression.js'

export let parse = (text, {negate = false} = {}) => {
	let expr
	![
		CallSourceExpression,
		PathSourceExpression,
		PropertySourceExpression,
		ValueSourceExpression,
	].find((exprClass) => {
		expr = exprClass.parse(text)
		return expr
	})
	if (expr) {
		expr.negate = negate
	}
	return expr
}