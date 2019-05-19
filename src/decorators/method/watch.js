import {requestMicrotask} from '../../utils/microtask.js'
import {observeHostProperty} from '../../utils/property-observer.js'

export let watch = (...props) => {
	return (descriptor) => {
		if (descriptor.kind !== 'method') {
			throw '@watch decorator can only be applied to a method'
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
			let canCall = isPropRelated && propsInfo.every((info) => {
				if (info.mandatory) {
					return host[info.prop] != null
				}
				return true
			})
			if (!canCall) {
				return
			}
			requestMicrotask(host, descriptor.key, () => {
				if (propsInfo.length === 1) {
					host[descriptor.key].call(host, oldVal)
				}
				else {
					let oldValues = propsInfo.map((info) => {
						return info.prop === prop ? oldVal : host[info.prop]
					})
					host[descriptor.key].call(host, ...oldValues)
				}
			})
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