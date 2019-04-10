export class RepeatContainer {
	constructor(element) {
		this.startComment = new Comment('repeat-start')
		this.endComment = new Comment('repeat-end')
		element.before(this.startComment)
		element.after(this.endComment)
	}

	append(element) {
		this.endComment.before(element)
	}
}