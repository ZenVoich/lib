import {requestMicrotask} from '../../utils/microtask.js'
import {observeProperty, addObserver} from '../../utils/property-observer.js'

export default (descriptor) => {
	if (descriptor.kind !== 'field') {
		throw '@notify decorator can only be applied to a property'
	}
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()

					observeProperty(this, descriptor.key)

					addObserver(this, (prop, oldVal, newVal) => {
						requestMicrotask(this, prop, () => {
							if (prop !== descriptor.key) {
								return
							}
							this.dispatchEvent(new CustomEvent(`${prop}-changed`))
						})
					})
				}
			}
		}
	}
}