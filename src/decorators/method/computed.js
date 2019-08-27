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
				let invalidated = true
				let updateValue = (host) => {
					if (canCall(host)) {
						value = getter.call(host)
						invalidated = false
					}
				}

				let unobserveList = []
				let pathsObserved = false
				let observePaths = (host) => {
					if (pathsObserved) {
						return
					}
					pathsObserved = true

					pathsInfo.forEach((info) => {
						let unobserve = observe(host, info.path, () => {
							requestMicrotask(host, 'computed:' + descriptor.key, () => {
								let oldValue = value
								updateValue(host)
								notifyProp(host, descriptor.key, oldValue, value)
							})
						})
						unobserveList.push(unobserve)
					})
				}

				return class extends Class {
					constructor() {
						super()
						observePaths(this)
					}

					get [descriptor.key]() {
						if (invalidated) {
							updateValue(this)
						}
						return value
					}

					connectedCallback() {
						super.connectedCallback && super.connectedCallback()
						observePaths(this)
					}

					disconnectedCallback() {
						super.disconnectedCallback && super.disconnectedCallback()
						invalidated = true
						unobserveList.forEach(fn => fn())
						unobserveList = []
						pathsObserved = false
					}
				}
			}
		}
	}
}