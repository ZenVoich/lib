import TargetExpression from './target-expression.js'

export default class ShowHideTargetExpression extends TargetExpression {
	static parseType = 'attribute'
	static updatePhase = 'animationFrame'

	static parse(element, attribute) {
		if (!['#show-if', '#hide-if'].includes(attribute)) {
			return
		}
		console.log(4)
		let target = new ShowHideTargetExpression
		target.element = element
		target.type = attribute.slice(1, -3)
		return target
	}

	element = null
	type = ''

	setValue(value) {
		let show = this.type === 'show' ? !!value : !value

		if (show) {
			this.element.style.removeProperty('display')
		}
		else {
			this.element.style.setProperty('display', 'none', 'important')
		}
	}

	getValue() {}
}