import TargetExpression from './target-expression.js'

export default class NodeTargetExpression extends TargetExpression {
	static parseType = 'node'
	static updatePhase = 'animationFrame'

	static parse(node) {
		let target = new NodeTargetExpression
		target.node = node
		return target
	}

	node = null

	setValue(value) {
		if (this.node.textContent !== value) {
			this.node.textContent = value
		}
	}

	getValue() {
		return this.node.textContent
	}
}