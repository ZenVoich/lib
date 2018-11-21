import define from './decorators/class/define.js'
import Initial from './mixins/initial.js'
import Template from './mixins/template.js'
import PropertyObserver from './mixins/property-observer.js'
import {Bindings} from './bindings/bindings.js'


@define('dom-repeat')
class DomRepeat extends PropertyObserver(Template(Initial(HTMLElement))) {
	static template = '<style>:host {display: contents;}</style><slot></slot>'
	static observedProperties = ['items', 'as']

	if = false
	#bindings;
	#raf;

	constructor() {
		super()
		console.log(1)
		this.template = this.querySelector('template')
		this.template.remove()
	}

	render() {
		this.innerHTML = ''
		let host = this.getRootNode().host
		this.items.forEach((item) => {
			// this.shadowRoot.querySe
			// this.key

			let content = this.template.content.cloneNode(true)

			let bindings = new Bindings(content)
			// bindings.connect(this)
			bindings.host = this.getRootNode().host
			bindings.state = {item}
			bindings.update()
			console.log(bindings)

			this.appendChild(content)
		})
	}

	propertyChangedCallback(prop, old) {
		this.render()
	}
}