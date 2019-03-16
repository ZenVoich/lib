export class RepeatContainer {
	constructor(element) {
		this.startComment = new Comment('repeat-start')
		this.endComment = new Comment('repeat-end')
		element.before(this.startComment)
		element.after(this.endComment)
	}

	getPreviousElementSibling(node) {
		let next = node.previousSibling

		if (next.nodeType === document.COMMENT_NODE && next === this.startComment) {
			return
		}
		if (next.nodeType !== document.ELEMENT_NODE) {
			return this.getPreviousElementSibling(next)
		}
		return next
	}

	getNextElementSibling(node) {
		let next = node.nextSibling

		if (next.nodeType === document.COMMENT_NODE && next === this.endComment) {
			return
		}
		if (next.nodeType !== document.ELEMENT_NODE) {
			return this.getNextElementSibling(next)
		}
		return next
	}

	getChildElementCount() {
		let curElement = this.getNextElementSibling(this.startComment)
		let count = 0
		while (curElement) {
			count++
			curElement = this.getNextElementSibling(curElement)
		}
		return count
	}

	getLastElementChild() {
		let lastElement = this.getPreviousElementSibling(this.endComment)
		if (lastElement !== this.startComment) {
			return lastElement
		}
	}

	getChildren() {
		let children = []
		let curElement = this.getNextElementSibling(this.startComment)
		while (curElement) {
			children.push(curElement)
			curElement = this.getNextElementSibling(curElement)
		}
		return children
	}

	getChildAt(index) {
		let curIndex = 0
		let curElement = this.getNextElementSibling(this.startComment)
		while (curElement) {
			if (curIndex === index) {
				return curElement
			}
			curElement = this.getNextElementSibling(curElement)
			curIndex++
		}
	}

	append(element) {
		this.endComment.before(element)
	}
}