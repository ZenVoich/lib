import {TargetExpression} from './target-expression.js'

export class NodeTargetExpression extends TargetExpression {
	static parseType = 'node'
	static updatePhase = 'animationFrame'

	static parseSkeleton(node) {
		return {
			class: this,
			isTextNode: node.nodeType === document.TEXT_NODE,
		}
	}

	static fromSkeleton(skeleton, node) {
		let target = new NodeTargetExpression
		target.node = node
		target.isTextNode = skeleton.isTextNode
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