import define from '../../decorators/class/define.js'

@define('random-number')
class RepeatExample extends HTMLElement {
	static template = `<div on-click="[[generateClick]]">[[num]]</div>`
	static styles = `:host { display: inline-block; }`

	num = 0

	constructor() {
		super()
		this.generate()
	}

	generate() {
		this.num = Math.round(Math.random() * 100)
	}

	generateClick(e) {
		e.stopPropagation()
		this.generate()
	}
}