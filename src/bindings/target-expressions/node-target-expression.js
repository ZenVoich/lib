import TargetExpression from './target-expression.js'

export default class NodeTargetExpression extends TargetExpression {
	static parseType = 'node'
	static updatePhase = 'rAF'

	static parse(node) {
		let target = new NodeTargetExpression
		target.node = node
		return target
	}

	node = null

	setValue(value) {
		this.node.textContent = value
	}

	getValue() {
		return this.node.textContent
	}
}