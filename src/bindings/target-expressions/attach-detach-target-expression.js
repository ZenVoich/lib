import TargetExpression from './target-expression.js'

export default class AttachDetachTargetExpression extends TargetExpression {
	static parseType = 'attribute'
	static updatePhase = 'animationFrame'

	static parse(element, attribute) {
		return
		if (!['#attach-if', '#detach-if'].includes(attribute)) {
			return
		}
		let target = new AttachDetachTargetExpression
		target.element = element
		target.type = attribute.slice(1, -3)
		return target
	}

	comment = new Comment
	element = null
	type = ''

	setValue(value) {
		let attach = this.type === 'attach' ? !!value : !value

		if (attach && !this.element.isConnected) {
			this.comment.replaceWith(this.element)
		}
		else if (!attach && this.element.isConnected) {
			this.element.replaceWith(this.comment)
		}
	}

	getValue() {}
}