import define from '../decorators/class/define.js'
import notify from '../decorators/prop/notify.js'
import watch from '../decorators/method/watch.js'
import Component from '../component.js'

import template from './two-way-bindings-example.html'
import styles from './two-way-bindings-example.css'

import './check-box.js'

@define('two-way-bindings-example')
class A extends Component {
	static template = template
	static styles = styles

	checked = false

	toggle() {
		this.checked = !this.checked
	}
}