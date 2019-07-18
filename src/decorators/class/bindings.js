import {TemplateRoot} from '../../bindings/template-root.js'
import {perf} from '../../utils/perf.js'

export let bindings = (descriptor) => {
	let templateRootSkeleton

	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()

					if (!this.__templateElement || !this.__templateElement.innerHTML) {
						return
					}

					let templateRoot
					if (templateRootSkeleton) {
						templateRoot = TemplateRoot.fromSkeleton(templateRootSkeleton)
					}
					else {
						templateRootSkeleton = TemplateRoot.parseSkeleton(this.__templateElement)
						templateRoot = TemplateRoot.fromSkeleton(templateRootSkeleton, this.__templateElement.cloneNode(true))
					}

					this.shadowRoot.append(templateRoot.content)

					templateRoot.connect(this, this.constructor.dirtyCheck)
					templateRoot.update(true, true)

					this.__templateRoot = templateRoot
				}
			}
		}
	}
}