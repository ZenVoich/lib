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
					// if (templateRootSkeleton) {
					// 	templateRoot = new TemplateRoot(templateRootSkeleton)
					// }
					// else {
					// 	templateRootSkeleton = TemplateRoot.parseSkeleton(this.__templateElement)
					// 	templateRoot = new TemplateRoot(templateRootSkeleton, this.__templateElement.cloneNode(true))
					// }
					if (!templateRootSkeleton) {
						templateRootSkeleton = TemplateRoot.parseSkeleton(this.__templateElement)
					}
					templateRoot = new TemplateRoot(templateRootSkeleton)

					this.shadowRoot.append(templateRoot.content)

					templateRoot.connect(this, this.constructor.dirtyCheck)
					templateRoot.update(null, true)
					templateRoot.render(null, true)

					this.__templateRoot = templateRoot
				}
			}
		}
	}
}