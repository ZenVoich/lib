import {Bindings} from '../bindings/bindings.js'

export default (Class) => {
	return class extends Class {
		ready() {
			super.ready()

			if (!this.shadowRoot || !this.shadowRoot.innerHTML) {
				return
			}
			this.bindings = new Bindings(this.shadowRoot)
			this.bindings.connect(this)
			this.bindings.update()

			// let props = new Set(this.constructor.observedProperties)
			// this.bindings.getAllRelatedProps().forEach((prop) => {
			// 	props.add(prop)
			// })
			// this.constructor.observedProperties = [...props]
		}
	}
}