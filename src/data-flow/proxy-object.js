let proxyObjects = new WeakSet
let observersByObject = new WeakMap

// object => Map(parentObject => Set(props))
let nesting = new WeakMap

let throwError = (...args) => {
	if (window.__testMode__) {
		throw args
	}
	console.error(...args)
}

export class ProxyObject {
	constructor() {
		return proxyObject(this)
	}
}

export let proxyObject = (object) => {
	if (proxyObjects.has(object)) {
		return object
	}
	let proxyObject = new Proxy(object, {
		set(target, property, value, receiver) {
			// if (Array.isArray(value) && !hasObservers(receiver, property)) {
			// 	return Reflect.set(target, property, value, receiver)
			// }

			let oldVal = Reflect.get(target, property, receiver)

			if (!isPrimitive(value)) {
				if (!proxyObjects.has(value) && hasObservers(receiver, property)) {
					let message = 'The value is non-primitive, has observers and is not an instance of ProxyObject'
					throwError('Setting property', `'${property}'`, 'on object', receiver, 'with value', value, '\n' + message)
				}
				if (oldVal) {
					deleteNesting(oldVal, receiver, property)
				}
				setNesting(value, receiver, property)
			}

			notifyPath(receiver, property, oldVal, value)

			return Reflect.set(target, property, value, receiver)
		},
	})

	proxyObjects.add(proxyObject)

	setNestingForExistingValues(proxyObject)

	return proxyObject
}

let setNestingForExistingValues = (object) => {
	Object.keys(object).forEach((key) => {
		let value = object[key]
		if (!isPrimitive(value)) {
			setNesting(value, object, key)
		}
	})
}

export let isPrimitive = (value) => {
	return value === null || typeof value !== 'object'
}

let setNesting = (object, parentObject, parentProp) => {
	let parents = nesting.get(object)
	if (!parents) {
		parents = new Map
		nesting.set(object, parents)
	}

	let parentProps = parents.get(parentObject)
	if (!parentProps) {
		parentProps = new Set
		parents.set(parentObject, parentProps)
	}

	parentProps.add(parentProp)
}

let deleteNesting = (object, parentObject, parentProp) => {
	let parents = nesting.get(object)
	if (!parents) {
		return
	}
	let parentProps = parents.get(parentObject)
	if (parentProps) {
		parentProps.delete(parentProp)
	}
}

export let observePath = (object, path, fn) => {
	let observersByPath = observersByObject.get(object)
	if (!observersByPath) {
		observersByPath = new Map
		observersByObject.set(object, observersByPath)
	}
	let observers = observersByPath.get(path)
	if (!observers) {
		observers = new Set
		observersByPath.set(path, observers)
	}
	observers.add(fn)

	// check if observable
	let currentPath = ''
	path.split('.').reduce((obj, prop) => {
		if (!obj) {
			return
		}

		currentPath += (currentPath && '.') + prop
		obj = obj[prop]

		if (currentPath !== path && !isPrimitive(obj) && !proxyObjects.has(obj)) {
			throwError(
				`Trying to observe the path '${path}' on object`,
				object,
				`but value at '${currentPath.slice(1)}'`,
				obj,
				`is not a primitive and is not an instance of ProxyObject`
			)
		}
		return obj
	}, object)
}

export let unobservePath = (object, path, fn) => {
	let observersByPath = observersByObject.get(object)
	if (!observersByPath) {
		return
	}
	let observers = observersByPath.get(path)
	if (!observers) {
		return
	}
	observers.delete(fn)
}

let getByPath = (obj, path) => {
	path = path.split('.')
	let check = () => {
		let prop = path.shift()
		if (!prop || !obj)
			return
		obj = obj[prop]
		check()
	}
	check()
	return obj
}

export let notifyPath = (object, path, oldVal, newVal) => {
	let observersByPath = observersByObject.get(object)
	if (observersByPath) {
		observersByPath.forEach((observers, observerPath) => {
			// exact match
			if (observerPath === path) {
				observers.forEach((fn) => {
					fn(oldVal, newVal)
				})
			}
			// nested observers (e.g. path=user and observerPath=user.name)
			else if (observerPath.startsWith(path + '.')) {
				let p = observerPath.slice((path + '.').length)
				let newNestedVal = getByPath(newVal, p)
				let oldNestedVal = getByPath(oldVal, p)
				if (newNestedVal !== oldNestedVal) {
					notifyPath(object, observerPath, oldNestedVal, newNestedVal)
				}
			}
		})
	}

	let parents = nesting.get(object)
	if (parents) {
		parents.forEach((parentProps, parent) => {
			parentProps.forEach((parentProp) => {
				notifyPath(parent, `${parentProp}.${path}`, oldVal, newVal)
			})
		})
	}
}

// note: path=a.b will match observer a.b.c
let hasObservers = (object, path) => {
	let observersByPath = observersByObject.get(object)
	if (observersByPath) {
		for (let [p, observers] of observersByPath) {
			if ((p === path || p.startsWith(path + '.')) && observers.size) {
				return true
			}
		}
	}

	let parents = nesting.get(object)
	if (parents) {
		for (let [parent, parentProps] of parents) {
			for (let parentProp of parentProps) {
				if (hasObservers(parent, `${parentProp}`)) {
					return true
				}
			}
		}
	}
}