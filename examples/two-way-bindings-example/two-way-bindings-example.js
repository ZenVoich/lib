import {tag, markup, styles} from '../../src/lib.js'
import {watch} from '../../src/decorators/method/watch.js'

import './check-box.js'

@tag('two-way-bindings-example')
@markup(import('./two-way-bindings-example.html'))
@styles(import('./two-way-bindings-example.css'))
class A extends HTMLElement {
	// checked = false

	// @watch('checked')
	// a() {
	// 	console.log('a', this.checked)
	// }

	toggle() {
		this.checked = !this.checked
	}
}