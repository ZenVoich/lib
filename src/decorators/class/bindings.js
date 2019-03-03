import {Template} from '../../bindings/template.js'
import {observeProperty, addObserver, removeObserver} from '../../utils/property-observer.js'
import perf from '../../utils/perf.js'

export default (descriptor) => {
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()
					if (!this.shadowRoot || !this.shadowRoot.innerHTML) {
						return
					}
					let template = new Template(this.shadowRoot)
					template.connect(this)

					template.getRelatedProps().forEach((prop) => {
						observeProperty(this, prop)
					})
					addObserver(this, (prop) => {
						template.updateProp(this, prop)
					})

					template.update(this)
					this.__template = template
				}
			}
		}
	}
}