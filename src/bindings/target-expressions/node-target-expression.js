import TargetExpression from './target-expression.js'

export default class NodeTargetExpression extends TargetExpression {
	static parseType = 'node'
	static updatePhase = 'animationFrame'

	static parse(node) {
		let target = new NodeTargetExpression
		target.node = node
		target.isTextNode = node.nodeType === document.TEXT_NODE
		return target
	}

	node = null
	isTextNode = false

	setValue(value) {
		if (this.isTextNode) {
			this.node.nodeValue = value
		}
		else {
			this.node.textContent = value
		}
	}

	getValue() {
		return this.node.textContent
	}
}