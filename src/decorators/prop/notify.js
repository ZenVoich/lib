import {requestMicrotask} from '../../utils/microtask.js'
import {observeHostProperty} from '../../utils/property-observer.js'

export let notify = (descriptor) => {
	if (descriptor.kind !== 'field') {
		throw '@notify decorator can only be applied to a property'
	}
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()

					observeHostProperty(this, descriptor.key, propObserver)
				}
			}
		}
	}
}

let propObserver = (oldVal, newVal, prop, host) => {
	requestMicrotask(host, prop, () => {
		host.dispatchEvent(new CustomEvent(`${prop}-changed`))
	})
}