import {TemplateRoot} from '../../bindings/template-root.js'
import {perf} from '../../utils/perf.js'

export let bindings = (descriptor) => {
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()
					if (!this.__templateElement || !this.__templateElement.innerHTML) {
						return
					}

					if (this.constructor.__templateRootSkeleton) {
						this.__templateRoot = TemplateRoot.fromSkeleton(this.constructor.__templateRootSkeleton)
					}
					else {
						this.constructor.__templateRootSkeleton = TemplateRoot.parseSkeleton(this.__templateElement)
						this.__templateRoot = TemplateRoot.fromSkeleton(this.constructor.__templateRootSkeleton, this.__templateElement.cloneNode(true))
					}

					this.__templateRoot.connect(this, true)
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