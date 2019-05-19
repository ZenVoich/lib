import {observeHostProperty, notifyHostProperty} from '../../utils/property-observer.js'

export let computed = (...props) => {
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

		let propObserver = (oldVal, newVal, prop, host) => {
			let isPropRelated = propsInfo.find((info) => {
				return prop === info.prop
			})
			let canNotify = isPropRelated && propsInfo.every((info) => {
				if (info.mandatory) {
					return host[info.prop] != null
				}
				return true
			})
			if (canNotify) {
				notifyHostProperty(host, descriptor.key)
			}
		}

		return {
			...descriptor,
			finisher(Class) {
				return class extends Class {
					constructor() {
						super()

						propsInfo.forEach((info) => {
							observeHostProperty(this, info.prop, propObserver)
						})
					}
				}
			}
		}
	}
}