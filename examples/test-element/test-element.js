import {define, template, styles, watch, debounce, attr, computed, notify, type, listen} from '../../src/lib.js'
import {TemplateRoot} from '../../src/bindings.js'
import {proxyObject} from '../../src/data-flow/proxy-object.js'

@define('test-element')
@template(import('./test-element.html'))
@styles(import('./test-element.css'))
class TestElement extends HTMLElement {
	@type(Number)
	x = 2

	y = 2

	@attr
	prop = 3

	obj = proxyObject({val: 5})
	proxy = proxyObject({
		p: 1,
		nested: proxyObject({n: 5})
	})
	array = proxyObject([])

	constructor() {
		super()

		this.innerHTML = this.prop
	}

	@attr
	@computed('prop', 'obj')
	get tt() {
		return this.prop + this.obj.val
	}

	@computed('y')
	get yy() {
		// console.trace('yy', this.y)
		return this.y + 1
	}

	@computed('tt')
	get gg() {
		return this.tt + 1
	}

	@computed('proxy.nested.n')
	get pp() {
		return `{${this.proxy.p}}`
	}

	@computed('noProp')
	get empty() {
		console.error('this must not be called', this.noProp)
		return this.noProp
	}

	@computed('empty')
	get empty2() {
		console.error('this must not be called 2')
	}

	// @watch('isConnected', 'x')
	// w() {
	// 	console.log('isConnected changed', this.isConnected, this.x)
	// }

	// @watch('proxy.nested')
	// w() {
	// 	console.log('proxy.nested changed')
	// }

	inputValue = '<b>x</b>'

	@watch('inputValue')
	watchInputValue() {
		console.log('inputValue changed', this.inputValue)
	}

	date = new Date

	@watch('date?')
	dateChanged() {
		console.log('date changed', this.date)
	}

	increment() {
		// for (var i = 0; i <= 100000; i++) {
		// for (var i = 0; i <= 1000; i++) {
		this.prop++
		this.x++
		this.prop++
		this.obj.val++
		this.obj = this.obj
		this.array.push(0)

		if (this.x % 5 === 0) {
			this.y++
		}

		if (this.x % 5 !== 0) {
			this.proxy.p++
			this.proxy.nested.n++
		}
		else {
			this.proxy = proxyObject({
				p: this.proxy.p + 1,
				nested: proxyObject({n: this.proxy.nested.n + 1})
			})
		}
		// }
	}

	add(a, b) {
		return a + b
	}

	isEven(num) {
		return num % 10 !== 0
	}

	@debounce(100)
	onInput(e) {
		console.log('onInput')
	}

	duplicate() {
		this.after(this.cloneNode(true))
	}

	unbox() {
		if (this.unboxed) {
			return
		}
		this.unboxed = true

		let templateRoot = TemplateRoot.parse(this.shadowRoot.querySelector('#template'))
		templateRoot.connect(this)
		templateRoot.update()

		this.shadowRoot.querySelector('#content').innerHTML = ''
		this.shadowRoot.querySelector('#content').append(templateRoot.content)
	}

	// @listen('button', 'click')
	// buttonClick(e) {
	// 	console.log('button click')
	// }

	// @listen('outside', 'click')
	// buttonClick(e) {
	// 	console.log('outside click')
	// }

	dragging = false

	@listen('host', 'pointerdown')
	dragStart(e) {
		this.dragging = true
		// console.log('down')
	}

	@listen('body', 'pointerup', ['dragging'])
	dragEnd() {
		this.dragging = false
		// console.log('up')
	}

	@listen('body', 'pointermove', ['dragging'])
	dragMove() {
		console.log('move')
	}
}


@define('t-t')
class TT extends HTMLElement {
	constructor() {
		super()
		console.log('tt constructor')
	}

	connectedCallback() {
		console.log('tt connectedCallback')
	}
}