import {TemplateRoot} from '../../bindings/template-root.js'
import {perf} from '../../utils/perf.js'

let connectTemplateRoot = (host) => {
	if (host.__templateRootConnected) {
		return
	}
	host.__templateRootConnected = true
	host.__templateRoot.connect(host, host.constructor.dirtyCheck)
	host.__templateRoot.update(null, true)
	host.__templateRoot.render(null, true)
}

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

					if (!templateRootSkeleton) {
						templateRootSkeleton = TemplateRoot.parseSkeleton(this.__templateElement)
					}
					this.__templateRoot = new TemplateRoot(templateRootSkeleton)
					this.shadowRoot.append(this.__templateRoot.content)
					connectTemplateRoot(this)
				}

				connectedCallback() {
					super.connectedCallback && super.connectedCallback()
					connectTemplateRoot(this)
				}

				disconnectedCallback() {
					super.disconnectedCallback && super.disconnectedCallback()
					this.__templateRoot.disconnect()
					this.__templateRootConnected = false
				}
			}
		}
	}
}