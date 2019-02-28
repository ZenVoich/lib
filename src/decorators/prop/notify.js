import {debounceMicrotask} from '../../utils/scheduler.js'
import {observeProperty, addObserver, removeObserver, notifyChange} from '../../utils/property-observer.js'

export default (descriptor) => {
	if (descriptor.kind !== 'field') {
		throw '@notify decorator can only be applied to a property'
	}
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				_notifyUpdateDebouncer

				constructor() {
					super()

					observeProperty(this, descriptor.key)

					addObserver(this, (prop, oldVal, newVal) => {
						this._notifyUpdateDebouncer = debounceMicrotask(this._notifyUpdateDebouncer, () => {
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