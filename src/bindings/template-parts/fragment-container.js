export class FragmentContainer {
	constructor(element) {
		this.fragment = document.createDocumentFragment()
		this.startComment = new Comment('fragment-start')
		this.endComment = new Comment('fragment-end')
		this.fragment.append(this.startComment, element, this.endComment)
	}

	get isConneted() {
		return this.startComment.isConnected
	}

	append(element) {
		this.endComment.before(element)
	}

	replaceWith(element) {
		if (!this.startComment.isConneted) {
			return
		}

		this.fragment.append(this.startComment)
		let curElement = this.startComment.nextElementSibling
		while (curElement && curElement !== this.endComment) {
			this.fragment.append(curElement)
			curElement = curElement.nextElementSibling
		}

		this.endComment.replaceWith(element)
		this.fragment.append(this.endComment)
	}
}