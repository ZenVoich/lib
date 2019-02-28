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

	connect(host, state) {
		this.bindings.connect(host, state)
	}

	update(state, host) {
		this.bindings.update()
	}

	updateProp(state, host, prop) {
		this.bindings.updateProp(prop)
	}

	getRelatedProps() {
		return this.bindings.getRelatedProps()
	}
}