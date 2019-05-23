import {define, watch, debounce, attr, computed, notify, type} from '../../src/lib.js'
import {TemplateRoot} from '../../src/bindings.js'
import {proxyObject} from '../../src/data-flow/proxy-object.js'

@define('test-element')
class TestElement extends HTMLElement {
	static template = import('./test-element.html')
	static styles = import('./test-element.css')

	@type(Number)
	x = 2

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

	@computed('tt')
	get gg() {
		return this.tt + 1
	}

	@computed('proxy.nested.n')
	get pp() {
		return `{${this.proxy.p}}`
	}

	// @watch('proxy.nested')
	// w() {
	// 	console.log('proxy.nested changed')
	// }

	increment() {
		// for (var i = 0; i <= 100000; i++) {
		// for (var i = 0; i <= 1000; i++) {
		this.prop++
		this.x++
		this.prop++
		this.obj.val++
		this.obj = this.obj
		this.array.push(0)

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
		templateRoot.update(this)

		this.shadowRoot.querySelector('#content').innerHTML = ''
		this.shadowRoot.querySelector('#content').append(templateRoot.content)
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