export class TargetExpression {
	static parseType = 'attribute' // attribute, node
	static parsePrecedence = 5
	static updatePhase = 'animationFrame' // microtask, animationFrame
	static parse(element, attribute) {}

	setValue(value) {}
	getValue() {}
	connect(host) {}
	disconnect() {}
}