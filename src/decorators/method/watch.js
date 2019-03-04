import {debounceMicrotask} from '../../utils/scheduler.js'
import {observeProperty, addObserver} from '../../utils/property-observer.js'

export default (...props) => {
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

		return {
			...descriptor,
			finisher(Class) {
				return class extends Class {
					_watchUpdateDebouncer

					constructor() {
						super()

						propsInfo.forEach((info) => {
							observeProperty(this, info.prop)
						})

						addObserver(this, (prop, oldVal, newVal) => {
							let isPropRelated = propsInfo.find((info) => {
								return prop === info.prop
							})
							let canCall = isPropRelated && propsInfo.every((info) => {
								if (info.mandatory) {
									return this[info.prop] !== null
								}
								return true
							})
							if (!canCall) {
								return
							}
							this._watchUpdateDebouncer = debounceMicrotask(this._watchUpdateDebouncer, () => {
								if (propsInfo.length === 1) {
									this[descriptor.key].call(this, oldVal)
								}
								else {
									let oldValues = propsInfo.map((info) => {
										return info.prop === prop ? oldVal : this[info.prop]
									})
									this[descriptor.key].call(this, ...oldValues)
								}
							})
						})
					}
				}
			}
		}
	}
}