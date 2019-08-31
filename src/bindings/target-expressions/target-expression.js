export class TargetExpression {
	static parseType = 'attribute' // attribute, node
	static parsePrecedence = 5
	static updatePhase = 'render' // microtask, render
	static parse(element, attribute) {}

	setValue(value) {}
	getValue() {}
	connect(host, templateRoot) {}
	disconnect() {}
}