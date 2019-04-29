import define from '../../src/decorators/class/define.js'
import notify from '../../src/decorators/prop/notify.js'
import watch from '../../src/decorators/method/watch.js'
import Component from '../../src/component.js'

import template from './two-way-bindings-example.html'
import styles from './two-way-bindings-example.css'

import './check-box.js'

@define('two-way-bindings-example')
class A extends HTMLElement {
	static template = template
	static styles = styles

	checked = false

	toggle() {
		this.checked = !this.checked
	}
}