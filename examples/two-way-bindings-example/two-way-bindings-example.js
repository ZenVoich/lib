import {tag} from '../../src/decorators/class/tag.js'
import {watch} from '../../src/decorators/method/watch.js'

import './check-box.js'

@tag('two-way-bindings-example')
class A extends HTMLElement {
	static template = import('./two-way-bindings-example.html')
	static styles = import('./two-way-bindings-example.css')

	// checked = false

	// @watch('checked')
	// a() {
	// 	console.log('a', this.checked)
	// }

	toggle() {
		this.checked = !this.checked
	}
}