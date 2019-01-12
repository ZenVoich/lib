import define from './decorators/class/define.js'
import watch from './decorators/method/watch.js'
import Initial from './mixins/initial.js'
import Template from './mixins/template.js'
import PropertyObserver from './mixins/property-observer.js'
import {Bindings} from './bindings/bindings.js'


@define('dom-if')
class DomIf extends PropertyObserver(Template(Initial(HTMLElement))) {
	static template = '<style>:host {display: contents;}</style><slot></slot>'

	if = false
	_bindings
	_raf

	constructor() {
		super()
		this.template = this.querySelector('template')
		this.template.remove()
	}

	@watch('if')
	render(oldIf) {
		if (Boolean(this.if) === oldIf) {
			return
		}
		cancelAnimationFrame(this._raf)
		this._raf = requestAnimationFrame(() => {
			if (this.if) {
				let content = this.template.content.cloneNode(true)

				let bindings = new Bindings(content)
				bindings.connect(this.getRootNode().host)
				bindings.update()

				this.innerHTML = ''
				this.appendChild(content)
				this._bindings = bindings
			} else {
				this.innerHTML = ''
				this._bindings.disconnect()
				this._bindings = null
			}
		})
	}
}