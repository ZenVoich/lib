import watch from './decorators/method/watch.js'
import define from './decorators/class/define.js'
import {Template} from './bindings/template.js'
import Component from './component.js'


@define('lib-if')
class DomIf extends Component {
	static template = '<style>:host {display: contents;}</style><slot></slot>'

	if = false
	_bindings
	_raf

	constructor() {
		super()
		this.templateEl = this.querySelector('template')
		this.templateEl.remove()
	}

	@watch('if')
	render(oldIf) {
		if (Boolean(this.if) === oldIf) {
			return
		}
		cancelAnimationFrame(this._raf)
		this._raf = requestAnimationFrame(() => {
			if (this.if) {
				let content = this.templateEl.content.cloneNode(true)
				let bindings = new Template(content)
				bindings.connect(this.getRootNode().host)
				bindings.update()
				this.innerHTML = ''
				bindings.render(this)
				this._bindings = bindings
			}
			else {
				this.innerHTML = ''
				this._bindings.disconnect()
				this._bindings = null
			}
		})
	}
}