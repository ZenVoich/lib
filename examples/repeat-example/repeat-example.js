import {define} from '../../src/lib.js'
import {perf} from '../../src/utils.js'
import {proxyObject} from '../../src/data-flow/proxy-object.js'

import './random-number.js'

@define('repeat-example')
class RepeatExample extends HTMLElement {
	static template = import('./repeat-example.html')
	static styles = import('./repeat-example.css')

	pi = Math.PI
	secret = '1-1'
	nested = {val: 'ppp'}
	show = false

	constructor() {
		super()
		this.items = proxyObject([])
	}

	connectedCallback() {
		document.addEventListener('click', () => {
			perf.run()
			setTimeout(() => {
				requestAnimationFrame(() => {
					perf.flush()
				})
			}, 100)
		}, {capture: true})
	}

	onClick(e) {
		e.currentTarget.item.value += 10
	}

	_isBig(num) {
		return num > 0.5
	}

	add(count, toStart) {
		perf.markStart('add')

		for (let i = 0; i < count; i++) {
			let rand = Math.random()
			this.items[toStart ? 'unshift' : 'push'](proxyObject({
				show: true,
				key: rand,
				value: rand,
				nested: proxyObject({val: 'aaa', items: proxyObject([
					proxyObject({id: 1, val: 1}),
					proxyObject({id: 2, val: 2}),
					proxyObject({id: 3, val: 3}),
					proxyObject({id: 4, val: 4}),
					proxyObject({id: 5, val: 5}),
				])}),
			}))
		}

		requestAnimationFrame(() => {
			perf.markEnd('add')
		})
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

	add10ThousandToStart() {
		this.add(10000, true)
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

	add10ThousandToEnd() {
		this.add(10000, false)
	}

	removeFirst() {
		this.items.shift()
	}

	removeLast() {
		this.items.pop()
	}

	removeAll() {
		this.items = proxyObject([])
	}

	updateProp() {
		this.pi++
	}

	updateFirstItemProp() {
		this.items[0].nested.items[0].val++
		this.items[0].nested.items[1].val++
		this.items[0].nested.items[2].val++
	}

	toggleFirstItemVisibility() {
		this.items[0].show = !this.items[0].show
	}

	clearSecondItem() {
		this.items[1].nested.items = proxyObject([])
	}
}

window.RepeatExample = RepeatExample