import {TemplateRoot} from '../../bindings/template-root.js'
import {observeProperty, addObserver, removeObserver} from '../../utils/property-observer.js'
import {perf} from '../../utils/perf.js'

export let bindings = (descriptor) => {
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()
					if (!this.__userTemplate || !this.__userTemplate.innerHTML) {
						return
					}

					if (this.constructor.__templateRootSkeleton) {
						this.__templateRoot = TemplateRoot.fromSkeleton(this.constructor.__templateRootSkeleton)
					}
					else {
						this.constructor.__templateRootSkeleton = TemplateRoot.parseSkeleton(this.__userTemplate)
						this.__templateRoot = TemplateRoot.fromSkeleton(this.constructor.__templateRootSkeleton, this.__userTemplate.cloneNode(true))
					}

					this.__templateRoot.connect(this)
					this.__templateRoot.getRelatedProps().forEach((prop) => {
						observeProperty(this, prop)
					})
					addObserver(this, (prop) => {
						this.__templateRoot.updateProp(this, prop)
					})

					this.__templateRootAttached = false
				}

				connectedCallback() {
					if (this.__templateRootAttached) {
						super.connectedCallback && super.connectedCallback()
						return
					}
					this.__templateRootAttached = true

					this.shadowRoot.append(this.__templateRoot.content)
					this.__templateRoot.update(this, true)

					super.connectedCallback && super.connectedCallback()
				}
			}
		}
	}
}