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
			let canNotify = pathsInfo.every((info) => {
				if (info.mandatory) {
					return getByPath(host, info.path) != null
				}
				return true
			})
			if (canNotify) {
				requestMicrotask(host, 'computed:' + descriptor.key, () => {
					notifyHostProperty(host, descriptor.key)
				})
			}
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