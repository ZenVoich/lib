import define from '../decorators/class/define.js'
import Component from '../component.js'
import attr from '../decorators/prop/attr.js'
import notify from '../decorators/prop/notify.js'
import {Template} from '../bindings/template.js'
import {observeProperty} from '../utils/property-observer.js'

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
		this.after(this.cloneNode(true))
	}

	unbox() {
		let content = this.shadowRoot.querySelector('#template').content.cloneNode(true)

		let template = new Template(content)
		template.connect(this)
		template.update()
		template.getRelatedProps().forEach((prop) => {
			observeProperty(this, prop)
		})

		this.shadowRoot.querySelector('#content').innerHTML = ''
		template.render(this.shadowRoot.querySelector('#content'))
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