import {define, watch, debounce, attr, computed, notify} from '../../src/lib.js'
import {observeProperty, addObserver} from '../../src/utils.js'
import {TemplateRoot} from '../../src/bindings.js'

@define('test-element')
class TestElement extends HTMLElement {
	static template = import('./test-element.html')
	static styles = import('./test-element.css')

	x = 2
	@attr
	prop = 3
	obj = {val: 5}

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

	increment() {
		// for (var i = 0; i <= 100000; i++) {
		// for (var i = 0; i <= 100000; i++) {
		this.prop++
		this.x++
		this.prop++
		this.obj.val++
		this.obj = this.obj
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
		templateRoot.getRelatedProps().forEach((prop) => {
			observeProperty(this, prop)
		})
		addObserver(this, (prop) => {
			templateRoot.updateProp(this, prop)
		})

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