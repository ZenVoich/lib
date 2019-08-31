import {tag, markup, styles, watch, computed} from '../../src/lib.js'
import {perf} from '../../src/utils.js'
import {proxyArray} from '../../src/data-flow/proxy-array.js'

import './random-number.js'

@tag('repeat-example')
@markup(import('./repeat-example.html'))
@styles(import('./repeat-example.css'))
class RepeatExample extends HTMLElement {
	pi = Math.PI
	secret = '1-1'
	nested = {val: 'ppp'}
	show = false

	constructor() {
		super()
		this.obj = {items: []}
		// this.obj.items = [{
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

	@watch('obj.items.*.value')
	_itemValueWatcher() {
		console.log('obj.items.*.value watcher')
	}

	@computed('obj.items.*.nested.items.*.val')
	get totalNestedVal() {
		let val = 0
		this.obj.items.forEach((item) => {
			item.nested.items.forEach((itm) => {
				val += itm.val
			})
		})
		return val
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
		// this.obj.items = this.obj.items
	}

	slide(element) {
		let style = getComputedStyle(element)
		let opacity = +style.opacity
		let height = parseFloat(style.height)
		let paddingTop = parseFloat(style.paddingTop)
		let paddingBottom = parseFloat(style.paddingBottom)
		let marginTop = parseFloat(style.marginTop)
		let marginBottom = parseFloat(style.marginBottom)
		let borderTopWidth = parseFloat(style.borderTopWidth)
		let borderBottomWidth = parseFloat(style.borderBottomWidth)

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

	_shouldHide(num) {
		return num > 250
	}

	createItem() {
		let rand = Math.random()
		return {
			show: true,
			key: rand,
			value: rand,
			nested: {
				val: 'aaa',
				items: [
				{id: 1, val: 1},
				{id: 2, val: 2},
				{id: 3, val: 3},
				{id: 4, val: 4},
				{id: 5, val: 5},
				]
			},
		}
	}

	add(count, toStart) {
		perf.markStart('add')

		for (let i = 0; i < count; i++) {
			this.obj.items[toStart ? 'unshift' : 'push'](this.createItem())
			// this.obj.items = this.obj.items
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
		this.obj.items.shift()
	}

	removeLast() {
		this.obj.items.pop()
	}

	removeAll() {
		this.obj.items = []
	}

	swapFirstTwo() {
		if (this.obj.items.length < 2) {
			return
		}
		var tmp = this.obj.items[0]
		this.obj.items[0] = this.obj.items[1]
		this.obj.items[1] = tmp
		this.obj.items = this.obj.items.slice()
	}

	replaceSecond() {
		if (this.obj.items.length > 1) {
			this.obj.items[1] = this.createItem()
			this.obj.items = this.obj.items.slice()
		}
	}

	sort() {
		this.obj.items.sort((a, b) => {
			return a.value - b.value
		})
	}

	reverse() {
		this.obj.items.reverse()
	}

	updateProp() {
		this.pi++
	}

	updateFirstItemProp() {
		this.obj.items[0].nested.items[0].val++
		this.obj.items[0].nested.items[1].val++
		this.obj.items[0].nested.items[2].val++
	}

	toggleFirstItemVisibility() {
		this.obj.items[0].show = !this.obj.items[0].show
	}

	clearSecondItem() {
		this.obj.items[1].nested.items = []
	}
}

window.RepeatExample = RepeatExample