import {observeHostProperty} from '../../utils/property-observer.js'

export let type = (type, required = false) => {
	return (descriptor) => {
		if (descriptor.kind !== 'field' && !descriptor.descriptor.set) {
			throw '@attr decorator can only be applied to a property or setter'
		}

		let property = descriptor.key

		let propObserver = (oldVal, newVal, prop, host) => {
			let value = host[prop]
			if (!required && value == null) {
				return
			}
			let matches = isTypeMatches(type, value)
			if (!matches) {
				throw `${host.localName}: the type of the property '${prop}' is expected to be '${stringifyType(type)}' (given value '${value}')`
			}
		}

		return {
			...descriptor,
			finisher(Class) {
				return class extends Class {
					constructor() {
						super()

						// on property change
						observeHostProperty(this, property, propObserver)

						// react on props already inited in constructor
						propObserver(null, null, property, this)
					}
				}
			}
		}
	}
}

let isTypeMatches = (type, value) => {
	let typeOf = typeof value

	if (type === Boolean) {
		return typeOf === 'boolean'
	}
	if (type === Number) {
		return typeOf === 'number' && !Number.isNaN(value)
	}
	if (type === String) {
		return typeOf === 'string'
	}
	if (type === Function) {
		return typeOf === 'function'
	}
	if (type === Array || Array.isArray(type)) {
		if (!Array.isArray(value)) {
			return false
		}
		return value.every((val) => {
			return isTypeMatches(type[0], val)
		})
	}
	if (type === Object) {
		return typeOf === 'object'
	}
	return value instanceof type
}

let stringifyType = (type) => {
	if (Array.isArray(type)) {
		if (type[0]) {
			return `[${stringifyType(type[0])}]`
		}
		return '[]'
	}
	return type.name
}