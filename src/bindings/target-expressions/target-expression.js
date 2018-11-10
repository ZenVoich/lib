export default class TargetExpression {
	static parseType = 'attribute' // attribute, node
	static parsePriority = 5
	static updatePhase = 'rAF' // microtask, rAF
	static parse(element, attribute) {}
}