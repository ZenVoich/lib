import {define} from '../../src/lib.js'

@define('random-number')
class RepeatExample extends HTMLElement {
	static template = `<div @click="{generateClick}">{num}</div>`
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