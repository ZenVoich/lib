export default class TargetExpression {
	static parseType = 'attribute' // attribute, node
	static parsePrecedence = 5
	static updatePhase = 'animationFrame' // microtask, animationFrame
	static parse(element, attribute) {}
}