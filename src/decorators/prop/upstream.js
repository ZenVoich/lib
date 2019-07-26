import {requestMicrotask} from '../../utils/microtask.js'
import {observePath} from '../../data-flow/observe-path.js'

export let upstream = (descriptor) => {
	if (descriptor.kind !== 'field') {
		throw '@upstream decorator can only be applied to a property'
	}
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()

					let notify = () => {
						requestMicrotask(this, 'notify:' + descriptor.key, () => {
							this.dispatchEvent(new CustomEvent(`${descriptor.key}-changed`))
						})
					}

					observePath(this, descriptor.key, notify)

					if (this[descriptor.key] !== undefined) {
						notify()
					}
				}
			}
		}
	}
}