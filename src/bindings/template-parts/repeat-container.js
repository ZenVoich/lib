export class RepeatContainer {
	constructor(element) {
		this.startComment = new Comment
		this.endComment = new Comment
		element.before(this.startComment)
		element.after(this.endComment)
	}

	getChildElementCount() {
		let curElement = this.startComment.nextElementSibling
		let count = 0
		while (curElement && curElement !== this.endComment) {
			count++
			curElement = curElement.nextElementSibling
		}
		return count
	}

	getLastElementChild() {
		let lastElement = this.endComment.previousElementSibling
		if (lastElement !== this.startComment) {
			return lastElement
		}
	}

	getChildren() {
		let children = []
		let curElement = this.startComment.nextElementSibling
		while (curElement && curElement !== this.endComment) {
			children.push(curElement)
			curElement = curElement.nextElementSibling
		}
		return children
	}

	getChildAt(index) {
		let curIndex = 0
		let curElement = this.startComment.nextElementSibling
		while (curElement && curElement !== this.endComment) {
			if (curIndex === index) {
				return curElement
			}
			curElement = curElement.nextElementSibling
			curIndex++
		}
	}

	append(element) {
		this.endComment.before(element)
	}
}