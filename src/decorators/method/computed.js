import {requestMicrotask} from '../../utils/microtask.js'
import {observe} from '../../data-flow/observer.js'
import {notifyProp} from '../../data-flow/observe-prop.js'
import {getByPath} from '../../utils/get-by-path.js'

export let computed = (...paths) => {
	return (descriptor) => {
		if (descriptor.kind !== 'method' || !descriptor.descriptor.get) {
			throw '@computed decorator can only be applied to a getter'
		}

		let pathsInfo = []
		paths.forEach((path) => {
			let info = {path: path, mandatory: true}
			if (path.endsWith('?')) {
				info.mandatory = false
				info.path = path.slice(0, -1)
			}
			pathsInfo.push(info)
		})

		let canCall = (host) => {
			return pathsInfo.every((info) => {
				return !info.mandatory || getByPath(host, info.path) != null
			})
		}

		return {
			...descriptor,
			finisher(Class) {
				let getter = Class.prototype.__lookupGetter__(descriptor.key)
				let value
				let updateValue = (host) => {
					if (canCall(host)) {
						value = getter.call(host)
					}
				}

				return class extends Class {
					constructor() {
						super()

						updateValue(this)

						pathsInfo.forEach((info) => {
							observe(this, info.path, () => {
								requestMicrotask(this, 'computed:' + descriptor.key, () => {
									updateValue(this)
									notifyProp(this, descriptor.key)
								})
							})
						})
					}

					get [descriptor.key]() {
						return value
					}
				}
			}
		}
	}
}