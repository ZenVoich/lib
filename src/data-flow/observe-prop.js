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

export let notifyProp = (object, prop, oldVal, newVal) => {
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


window.notifyProp = notifyProp


let mutationMehtods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

let defineAccessors = (object, prop) => {
	// array
	if (prop === 'length' && Array.isArray(object)) {
		mutationMehtods.forEach((method) => {
			Object.defineProperty(object, method, {
				enumerable: false,
				writable: true,
				configurable: true,
				value(...args) {
					let oldLength = object.length
					let removedItems = []
					let addedItems = []
					let result = Array.prototype[method].call(object, ...args)

					if (method === 'push' || method === 'unshift') {
						addedItems = args
					}
					else if (method === 'pop' || method === 'shift') {
						removedItems = [result]
					}
					else if (method === 'splice') {
						removedItems = result
						addedItems = args.slice(2)
					}

					notifyProp(object, prop, removedItems, addedItems)
					return result
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