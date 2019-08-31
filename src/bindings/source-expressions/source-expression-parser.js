import {ValueSourceExpression} from './value-source-expression.js'
import {PropertySourceExpression} from './property-source-expression.js'
import {PathSourceExpression} from './path-source-expression.js'
import {EqualitySourceExpression} from './equality-source-expression.js'
import {CallSourceExpression} from './call-source-expression.js'
import {ArgPlaceholderSourceExpression} from './arg-placeholder-source-expression.js'

let sourceExprClasses = [
	CallSourceExpression,
	EqualitySourceExpression,
	PathSourceExpression,
	PropertySourceExpression,
	ValueSourceExpression,
	ArgPlaceholderSourceExpression,
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