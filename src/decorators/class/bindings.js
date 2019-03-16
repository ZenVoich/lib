import {TemplateRoot} from '../../bindings/template-root.js'
import {observeProperty, addObserver, removeObserver} from '../../utils/property-observer.js'
import perf from '../../utils/perf.js'

export default (descriptor) => {
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()
					if (!this.__userTemplate || !this.__userTemplate.innerHTML) {
						return
					}
					let templateRoot = new TemplateRoot(this.__userTemplate.cloneNode(true))
					templateRoot.connect(this)

					templateRoot.getRelatedProps().forEach((prop) => {
						observeProperty(this, prop)
					})
					addObserver(this, (prop) => {
						templateRoot.updateProp(this, prop)
					})

					this.shadowRoot.append(templateRoot.content)
					templateRoot.update(this)
					this.__templateRoot = templateRoot
				}
			}
		}
	}
}