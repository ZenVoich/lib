import define from '../decorators/class/define.js'
import Component from '../component.js'
import {Bindings} from '../bindings/bindings.js'

import template from './repeat-example.html'
import styles from './repeat-example.css'

import './random-number.js'

@define('repeat-example')
class RepeatExample extends Component {
	static template = template
	static styles = styles

	pi = Math.PI
	nested = {val: 'ppp'}

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
			this.items[toStart ? 'unshift' : 'push']({
				key: rand,
				value: rand,
				nested: {val: 'aaa', items: [
					{id: 1, val: 1},
					{id: 2, val: 2},
					{id: 3, val: 3},
					{id: 4, val: 4},
					{id: 5, val: 5},
				]},
			})
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

	removeAll() {
		this.items = []
	}

	updateProp() {
		this.pi++
	}
}

window.RepeatExample = RepeatExample