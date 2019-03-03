import PropertyTargetExpression from './property-target-expression.js'
import AttributeTargetExpression from './attribute-target-expression.js'
import NodeTargetExpression from './node-target-expression.js'
import EventTargetExpression from './event-target-expression.js'

let targetExprClasses = [
	PropertyTargetExpression,
	AttributeTargetExpression,
	NodeTargetExpression,
	EventTargetExpression,
].sort((a, b) => {
	return b.parsePrecedence - a.parsePrecedence
}).reduce((acc, Class) => {
	if (!acc[Class.parseType]) {
		acc[Class.parseType] = []
	}
	acc[Class.parseType].push(Class)
	return acc
}, {})

export let parse = (parseType, ...args) => {
	let target
	targetExprClasses[parseType].find((exprClass) => {
		target = exprClass.parse(...args)
		return target
	})
	return target
}