import define from '../decorators/class/define.js'
import Element from '../element.js'
import {Bindings} from '../bindings/bindings.js'

import template from './repeat-example.html'
import styles from './repeat-example.css'


@define('repeat-example')
class RepeatExample extends Element {
	static template = template
	static styles = styles

	constructor() {
		super()
		this.items = []
	}

	add(count) {
		Array(count).fill(0).forEach(() => {
			let rand = Math.random()
			this.items.push({key: rand, value: rand})
		})
		this.items = this.items
	}

	addOne() {
		this.add(1)
	}

	addThousand() {
		this.add(1000)
	}
}

window.RepeatExample = RepeatExample