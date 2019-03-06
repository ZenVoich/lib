import {observeProperty, addObserver, notifyChange} from '../../utils/property-observer.js'

export default (...props) => {
	return (descriptor) => {
		if (descriptor.kind !== 'method' || !descriptor.descriptor.get) {
			throw '@computed decorator can only be applied to a getter'
		}

		return {
			...descriptor,
			finisher(Class) {
				return class extends Class {
					constructor() {
						super()

						props.forEach((prop) => {
							observeProperty(this, prop)
						})

						addObserver(this, (prop, oldVal, newVal) => {
							if (props.includes(prop)) {
								// old/new val?
								notifyChange(this, descriptor.key)
							}
						})
					}
				}
			}
		}
	}
}