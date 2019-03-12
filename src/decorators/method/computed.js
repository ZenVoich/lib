import {observeProperty, addObserver, notifyChange} from '../../utils/property-observer.js'

export default (...props) => {
	return (descriptor) => {
		if (descriptor.kind !== 'method' || !descriptor.descriptor.get) {
			throw '@computed decorator can only be applied to a getter'
		}

		let propsInfo = []
		props.forEach((prop) => {
			let info = {prop: prop, mandatory: true}
			if (prop.endsWith('?')) {
				info.mandatory = false
				info.prop = prop.slice(0, -1)
			}
			propsInfo.push(info)
		})

		return {
			...descriptor,
			finisher(Class) {
				return class extends Class {
					constructor() {
						super()

						propsInfo.forEach((info) => {
							observeProperty(this, info.prop)
						})

						addObserver(this, (prop, oldVal, newVal) => {
							let isPropRelated = propsInfo.find((info) => {
								return prop === info.prop
							})
							let canNotify = isPropRelated && propsInfo.every((info) => {
								if (info.mandatory) {
									return this[info.prop] != null
								}
								return true
							})
							if (canNotify) {
								notifyChange(this, descriptor.key)
							}
						})
					}
				}
			}
		}
	}
}