import {requestMicrotask} from '../../utils/microtask.js'
import {observe} from '../../data-flow/observer.js'
import {getByPath} from '../../data-flow/proxy-object.js'

export let listen = (selector, event, paths, options) => {
	if (!options && !Array.isArray(paths)) {
		options = paths
		paths = []
	}

	return (descriptor) => {
		if (descriptor.kind !== 'method') {
			throw '@listen decorator can only be applied to a method'
		}

		let pathsInfo = []
		!['__isConnected', ...paths].forEach((path) => {
			let info = {path: path, negate: false}
			if (path.startsWith('!')) {
				info.negate = true
				info.path = path.slice(1)
			}
			pathsInfo.push(info)
		})

		return {
			...descriptor,
			finisher(Class) {
				return class extends Class {
					constructor() {
						super()

						let target
						let listener
						if (selector === 'host') {
							target = this
							listener = this[descriptor.key].bind(this)
						}
						else if (selector === 'body') {
							target = document
							listener = this[descriptor.key].bind(this)
						}
						else if (selector === 'outside') {
							target = document
							listener = (e) => {
								if (!e.composedPath().includes(this)) {
									this[descriptor.key].call(this, e)
								}
							}
						}
						else {
							// target = host.shadowRoot
							// listener = (e) => {
							// 	if (e.target.closest(selector)) {
							// 		listener.call(host, e)
							// 	}
							// }
							throw `@listen selector must be one of 'host', 'body' or 'outside'`
						}

						let isListening = false
						let checkState = (state) => {
							let canListen = pathsInfo.every((info) => {
								let value = getByPath(state, info.path)
								return info.negate ? !value : value
							})
							if (canListen && !isListening) {
								target.addEventListener(event, listener, options)
								isListening = true
							}
							else if (!canListen && isListening) {
								target.removeEventListener(event, listener, options)
								isListening = false
							}
						}

						if (pathsInfo.length) {
							pathsInfo.forEach((info) => {
								observe(this, this, info.path, (oldVal, newVal, path, state, host) => {
									let isPathRelated = pathsInfo.find((info) => {
										return path === info.path
									})
									if (isPathRelated) {
										requestMicrotask(host, 'listen:' + descriptor.key, () => {
											checkState(state)
										})
									}
								})
							})
						}
						else {
							checkState(this)
						}
					}
				}
			}
		}
	}
}