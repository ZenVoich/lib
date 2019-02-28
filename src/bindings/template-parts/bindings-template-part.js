import TemplatePart from './template-part.js'
import {Bindings} from '../bindings.js'

export default class BindingsTemplatePart extends TemplatePart {
	static parse(root) {
		let part = new BindingsTemplatePart
		part.root = root
		part.bindings = new Bindings(root)
		return part
	}

	bindings = null

	connect(host) {
		this.bindings.connect(host)
	}

	disconnect() {
		this.bindings.disconnect()
	}

	update(state) {
		this.bindings.update(state)
	}

	updateProp(state, prop) {
		this.bindings.updateProp(state, prop)
	}

	getRelatedProps() {
		return this.bindings.getRelatedProps()
	}
}