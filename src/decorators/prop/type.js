import {observeProperty, addObserver} from '../../utils/property-observer.js'

export let type = (type, required = false) => {
	return (descriptor) => {
		if (descriptor.kind !== 'field' && !descriptor.descriptor.set) {
			throw '@attr decorator can only be applied to a property or setter'
		}

		let property = descriptor.key

		return {
			...descriptor,
			finisher(Class) {
				return class extends Class {
					constructor() {
						super()

						observeProperty(this, property)

						// on property change
						let propChanged = () => {
							let value = this[property]
							if (!required && value == null) {
								return
							}
							let matches = isTypeMatches(type, value)
							if (!matches) {
								throw `${this.localName}: the type of the property '${property}' is expected to be '${stringifyType(type)}' (given value '${value}')`
							}
						}

						addObserver(this, (prop, oldVal, newVal) => {
							if (prop === property) {
								propChanged()
							}
						})

						// react on props already inited in constructor
						propChanged()
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