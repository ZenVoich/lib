export class FragmentContainer {
	constructor(fragment) {
		if (fragment.childElementCount === 1 && fragment.firstElementChild.localName !== 'template') {
			this.simpleMode = true
			this.element = fragment.firstElementChild
			return
		}
		this.fragment = fragment
		this.startComment = new Comment('fragment-start')
		this.endComment = new Comment('fragment-end')
		this.fragment.prepend(this.startComment)
		this.fragment.append(this.endComment)
	}

	get content() {
		return this.element || this.fragment
	}

	get isConnected() {
		if (this.simpleMode) {
			return this.element.isConnected
		}
		return this.startComment.isConnected
	}

	_getNextSibling(node) {
		let next = node.nextSibling

		if (next.nodeType === document.COMMENT_NODE && next === this.endComment) {
			return
		}
		return next
	}

	replaceWith(element) {
		if (this.simpleMode) {
			this.element.isConnected && this.element.replaceWith(element)
			return
		}

		if (!this.startComment.isConnected) {
			return
		}

		let curElement = this._getNextSibling(this.startComment)
		this.fragment.append(this.startComment)
		while (curElement && curElement !== this.endComment) {
			let temp = curElement
			curElement = this._getNextSibling(curElement)
			this.fragment.append(temp)
		}

		this.endComment.replaceWith(element)
		this.fragment.append(this.endComment)
	}

	remove() {
		if (this.simpleMode) {
			this.element.remove()
			return
		}

		let curElement = this.startComment
		while (curElement && curElement !== this.endComment) {
			let temp = curElement
			curElement = this._getNextSibling(curElement)
			this.fragment.append(temp)
		}
		this.fragment.append(this.endComment)
	}

	before(element) {
		this.startComment.before(element)
	}
}