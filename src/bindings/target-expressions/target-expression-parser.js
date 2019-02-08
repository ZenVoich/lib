import PropertyTargetExpression from './property-target-expression.js'
import AttributeTargetExpression from './attribute-target-expression.js'
import NodeTargetExpression from './node-target-expression.js'
import EventTargetExpression from './event-target-expression.js'
import ShowHideTargetExpression from './show-hide-target-expression.js'

let exprClasses = [
	PropertyTargetExpression,
	AttributeTargetExpression,
	NodeTargetExpression,
	EventTargetExpression,
	ShowHideTargetExpression,
].sort((a, b) => {
	return b.parsePriority - a.parsePriority
}).reduce((acc, Class) => {
	if (!acc[Class.parseType]) {
		acc[Class.parseType] = []
	}
	acc[Class.parseType].push(Class)
	return acc
}, {})

export let parse = (parseType, ...args) => {
	let target
	exprClasses[parseType].find((exprClass) => {
		target = exprClass.parse(...args)
		return target
	})
	return target
}