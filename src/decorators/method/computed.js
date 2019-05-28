import {requestMicrotask} from '../../utils/microtask.js'
import {notifyHostProperty} from '../../utils/property-observer.js'
import {observe} from '../../data-flow/observer.js'
import {getByPath} from '../../data-flow/proxy-object.js'

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

		let observer = (oldVal, newVal, path, host) => {
			requestMicrotask(host, 'computed:' + descriptor.key, () => {
				let canNotify = pathsInfo.every((info) => {
					return !info.mandatory || getByPath(host, info.path) != null
				})
				if (canNotify) {
					notifyHostProperty(host, descriptor.key)
				}
			})
		}

		return {
			...descriptor,
			finisher(Class) {
				return class extends Class {
					constructor() {
						super()

						pathsInfo.forEach((info) => {
							observe(this, info.path, observer)
						})
					}
				}
			}
		}
	}
}