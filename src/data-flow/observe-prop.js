let observersByObject = new WeakMap
window.observersByObject = observersByObject

export let observeProp = (object, prop, fn) => {
	let observersByProp = observersByObject.get(object)
	if (!observersByProp) {
		observersByProp = new Map
		observersByObject.set(object, observersByProp)
	}
	let observers = observersByProp.get(prop)
	if (!observers) {
		defineAccessors(object, prop)
		observers = new Set
		observersByProp.set(prop, observers)
	}
	observers.add(fn)

	return () => {
		observers.delete(fn)
	}
}

window.observeProp = observeProp

let notifyProp = (object, prop, oldVal, newVal) => {
	let observersByProp = observersByObject.get(object)
	if (!observersByProp) {
		return
	}
	let observers = observersByProp.get(prop)
	if (observers) {
		observers.forEach((fn) => {
			fn(oldVal, newVal)
		})
	}
}

let mutationMehtods = ['push', 'pop', 'shift', 'unshift', 'splice']

// let accessorsDefined = new WeakMap
let defineAccessors = (object, prop) => {
	// let accessorsByProp = accessorsDefined.get(object)
	// if (accessorsDefined.has(object)) {
	// 	return
	// }
	// accessorsDefined.add(object)

	// array
	if (prop === 'length' && Array.isArray(object)) {
		mutationMehtods.forEach((method) => {
			Object.defineProperty(object, method, {
				enumerable: false,
				writable: true,
				configurable: true,
				value(...items) {
					let oldLength = object.length
					Array.prototype[method].call(object, ...items)
					if (oldLength !== object.length) {
						notifyProp(object, prop, oldLength, object.length)
					}
					return object.length
				}
			})
		})
		return
	}

	// object
	let setter = object.__lookupSetter__(prop)
	let getter = object.__lookupGetter__(prop)
	let value = setter || getter ? null : object[prop]

	Object.defineProperty(object, prop, {
		enumerable: true,
		configurable: true,
		set(val) {
			let oldVal = getter ? getter.call(object) : value
			if (setter) {
				setter.call(object, val)
			}
			else {
				value = val
			}
			if (oldVal !== val) {
				notifyProp(object, prop, oldVal, val)
			}
		},
		get() {
			return getter ? getter.call(object) : value
		},
	})

	// if (value !== undefined) {
	// 	notifyProp(object, prop, undefined, value)
	// }
}