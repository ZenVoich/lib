import define from '../decorators/class/define.js'
import Element from '../element.js'

@define('random-number')
class RepeatExample extends Element {
	static template = `<div on-click="[[generate]]">[[num]]</div>`
	static styles = `:host { display: inline-block; }`

	num = 0

	constructor() {
		super()
		this.generate()
	}

	generate() {
		this.num = Math.round(Math.random() * 100)
	}
}