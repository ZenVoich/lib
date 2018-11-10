import define from '../decorators/class/define.js'
import Element from '../element.js'
import {Bindings} from '../bindings/bindings.js'

import template from './test-element.html'
import styles from './test-element.css'


@define('test-element')
class TestElement extends Element {
	static template = template
	static styles = styles

	x = 2
	prop = 3
	obj = {val: 5}

	constructor() {
		super()
		this.innerHTML = this.prop
	}

	increment() {
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

	duplicate() {
		this.insertAdjacentElement('afterend', this.cloneNode(true))
	}

	unbox() {
		let content = this.shadowRoot.querySelector('#template').content.cloneNode(true)

		let bindings = new Bindings(content)
		bindings.connect(this)
		bindings.update()
		bindings.getAllRelatedProps().forEach((prop) => {
			this.observeProperty(prop)
		})

		this.shadowRoot.querySelector('#content').innerHTML = ''
		this.shadowRoot.querySelector('#content').appendChild(content)
	}

	propertyChangedCallback(prop, old, newVal) {
		super.propertyChangedCallback(...arguments)
		// console.log(prop, old, newVal)
	}
}

window.TestElement = TestElement

// customElements.define('test-element', TestElement)