import {tag, markup, styles, attr, computed} from '../../src/lib.js'

@tag('random-number')
@markup(`<div @click="{generateClick}">{num}</div>`)
@styles(`:host { display: inline-block; }`)
class RepeatExample extends HTMLElement {

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