import define from '../decorators/class/define.js'
import Element from '../element.js'
import {Bindings} from '../bindings/bindings.js'

import template from './repeat-example.html'
import styles from './repeat-example.css'

import './random-number.js'


@define('repeat-example')
class RepeatExample extends Element {
	static template = template
	static styles = styles

	pi = Math.PI

	constructor() {
		super()
		this.items = []
	}

	onClick(e) {
		e.currentTarget.item.value += 10
		this.items = this.items
		// notify changes?
	}

	add(count, toStart) {
		for (let i = 0; i < count; i++) {
			let rand = Math.random()
			this.items[toStart ? 'unshift' : 'push']({key: rand, value: rand})
		}
		this.items = this.items
	}

	addOneToStart() {
		this.add(1, true)
	}

	addHundredToStart() {
		this.add(100, true)
	}

	addThousandToStart() {
		this.add(1000, true)
	}

	addOneToEnd() {
		this.add(1, false)
	}

	addHundredToEnd() {
		this.add(100, false)
	}

	addThousandToEnd() {
		this.add(1000, false)
	}

	removeFirst() {
		this.items.shift()
		this.items = this.items
	}

	removeLast() {
		this.items.pop()
		this.items = this.items
	}

	updateProp() {
		this.pi++
	}
}

window.RepeatExample = RepeatExample