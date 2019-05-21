import {requestMicrotask} from '../../utils/microtask.js'
import {observe} from '../../data-flow/observer.js'
import {getByPath} from '../../data-flow/proxy-object.js'

export let watch = (...paths) => {
	return (descriptor) => {
		if (descriptor.kind !== 'method') {
			throw '@watch decorator can only be applied to a method'
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
			let isPathRelated = pathsInfo.find((info) => {
				return path === info.path
			})
			let canCall = isPathRelated && pathsInfo.every((info) => {
				if (info.mandatory) {
					return getByPath(host, info.path) != null
				}
				return true
			})
			if (!canCall) {
				return
			}
			requestMicrotask(host, 'watch:' + descriptor.key, () => {
				if (pathsInfo.length === 1) {
					host[descriptor.key].call(host, oldVal)
				}
				else {
					let oldValues = pathsInfo.map((info) => {
						return info.path === path ? oldVal : getByPath(host, info.path)
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

						pathsInfo.forEach((info) => {
							observe(this, info.path, observer)
						})
					}
				}
			}
		}
	}
}