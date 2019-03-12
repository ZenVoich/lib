import define from '../decorators/class/define.js'
import Component from '../component.js'
import watch from '../decorators/method/watch.js'
import debounce from '../decorators/method/debounce.js'
import attr from '../decorators/prop/attr.js'
import computed from '../decorators/method/computed.js'
import notify from '../decorators/prop/notify.js'
import {Template} from '../bindings/template.js'
import {observeProperty, addObserver} from '../utils/property-observer.js'

import template from './test-element.html'
import styles from './test-element.css'


@define('test-element')
class TestElement extends Component {
	static template = template
	static styles = styles

	x = 2
	@attr
	prop = 3
	obj = {val: 5}
	k = null

	constructor() {
		super()

		this.innerHTML = this.prop
	}

	@attr
	@computed('prop', 'obj', 'k')
	get tt() {
		return this.prop + this.obj.val
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

		let content = this.shadowRoot.querySelector('#template').content.cloneNode(true)
		let template = new Template(content)
		template.connect(this)
		template.update(this)
		template.getRelatedProps().forEach((prop) => {
			observeProperty(this, prop)
		})
		addObserver(this, (prop) => {
			template.updateProp(this, prop)
		})

		this.shadowRoot.querySelector('#content').innerHTML = ''
		this.shadowRoot.querySelector('#content').append(content)
	}
}


@define('t-t')
class TT extends Component {
	constructor() {
		super()
		console.log('tt constructor')
	}

	connectedCallback() {
		console.log('tt connectedCallback')
	}
}