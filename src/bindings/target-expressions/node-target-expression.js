import {TargetExpression} from './target-expression.js'

export class NodeTargetExpression extends TargetExpression {
	static parseType = 'node'
	static updatePhase = 'render'

	static parseSkeleton(node) {
		return {
			isTextNode: node.nodeType === document.TEXT_NODE,
		}
	}

	#isTextNode = false
	#node = null

	constructor({isTextNode}, node) {
		super()
		this.#isTextNode = isTextNode
		this.#node = node
	}

	setValue(value) {
		if (this.#isTextNode) {
			this.#node.nodeValue = value
		}
		else {
			this.#node.textContent = value
		}
	}

	getValue() {
		return this.#node.textContent
	}
}