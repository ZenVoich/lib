import {define, attr, computed} from '../../src/lib.js'

@define('random-number')
class RepeatExample extends HTMLElement {
	static template = `<div @click="{generateClick}">{num}</div>`
	static styles = `:host { display: inline-block; }`

	@attr
	num = 0

	@attr
	@computed('num')
	get n() {
		return this.num
	}

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