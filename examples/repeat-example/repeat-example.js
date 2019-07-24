import {define} from '../../src/lib.js'
import {perf} from '../../src/utils.js'

import './random-number.js'

@define('repeat-example')
class RepeatExample extends HTMLElement {
	static template = import('./repeat-example.html')
	static styles = import('./repeat-example.css')
	// static dirtyCheck = true

	pi = Math.PI
	secret = '1-1'
	nested = {val: 'ppp'}
	show = false

	constructor() {
		super()
		this.items = []
		// this.items = [{
		// 		show: true,
		// 		key: 0,
		// 		value: 0,
		// 		nested: {val: 'aaa', items: [
		// 			{id: 1, val: 1},
		// 			{id: 2, val: 2},
		// 			{id: 3, val: 3},
		// 			{id: 4, val: 4},
		// 			{id: 5, val: 5},
		// 		]},
		// 	}]
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
		// this.items = this.items
	}

	slide(element) {
		let style = getComputedStyle(element);
		let opacity = +style.opacity;
		let height = parseFloat(style.height);
		let paddingTop = parseFloat(style.paddingTop);
		let paddingBottom = parseFloat(style.paddingBottom);
		let marginTop = parseFloat(style.marginTop);
		let marginBottom = parseFloat(style.marginBottom);
		let borderTopWidth = parseFloat(style.borderTopWidth);
		let borderBottomWidth = parseFloat(style.borderBottomWidth);

		return {
			duration: 300,
			tick(t) {
				element.style.overflow = 'hidden'
				element.style.opacity = Math.min(t * 3, 1) * opacity
				element.style.height = t * height + 'px'
				element.style.paddingTop = t * paddingTop + 'px'
				element.style.paddingBottom = t * paddingBottom + 'px'
				element.style.marginTop = t * marginTop + 'px'
				element.style.marginBottom = t * marginBottom + 'px'
				element.style.borderTopWidth = t * borderTopWidth + 'px'
				element.style.borderBottomWidth = t * borderBottomWidth + 'px'
			},
			finish() {
				element.style.overflow = ''
				element.style.opacity = ''
				element.style.height = ''
				element.style.paddingTop = ''
				element.style.paddingBottom = ''
				element.style.marginTop = ''
				element.style.marginBottom = ''
				element.style.borderTopWidth = ''
				element.style.borderBottomWidth = ''
			}
		}
	}

	_isBig(num) {
		return num > 0.5
	}

	add(count, toStart) {
		perf.markStart('add')

		for (let i = 0; i < count; i++) {
			let rand = Math.random()
			this.items[toStart ? 'unshift' : 'push']({
				show: true,
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
			// this.items = this.items
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
		this.items = []
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
		this.items[1].nested.items = []
	}
}

window.RepeatExample = RepeatExample