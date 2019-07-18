import {requestMicrotask} from '../../utils/microtask.js'
import {observe} from '../../data-flow/observer.js'
import {getByPath} from '../../utils/get-by-path.js'

export let watch = (...paths) => {
	return (descriptor) => {
		if (descriptor.kind !== 'method') {
			throw '@watch decorator can only be applied to a method'
		}

		let pathsInfo = []
		paths.forEach((path) => {
			if (path === 'isConnected') {
				path = '__isConnected'
			}
			let info = {path: path, mandatory: true}
			if (path.endsWith('?')) {
				info.mandatory = false
				info.path = path.slice(0, -1)
			}
			pathsInfo.push(info)
		})

		return {
			...descriptor,
			finisher(Class) {
				return class extends Class {
					constructor() {
						super()

						pathsInfo.forEach((info) => {
							observe(this, info.path, (oldVal, newVal, path) => {
								let canCall = pathsInfo.every((info) => {
									if (info.mandatory) {
										return getByPath(this, info.path) != null
									}
									return true
								})
								if (!canCall) {
									return
								}
								requestMicrotask(this, 'watch:' + descriptor.key, () => {
									if (pathsInfo.length === 1) {
										this[descriptor.key].call(this, oldVal)
									}
									else {
										let oldValues = pathsInfo.map((info) => {
											return info.path === path ? oldVal : getByPath(this, info.path)
										})
										this[descriptor.key].call(this, ...oldValues)
									}
								})
							})
						})
					}
				}
			}
		}
	}
}