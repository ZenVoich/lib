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

			// check
			if (value != null && !proxyObjects.has(value) && hasObservers(receiver, property, true)) {
				let message = '\n1. The value is not a proxy-object. \n2. This path has nested observers that will be lost after assignment.'
				throwError(`Setting property '${property}' on object`, receiver, 'with value', value, message)
				return
			}

			// update nesting
			if (canObserve(value)) {
				if (oldVal) {
					deleteNesting(oldVal, receiver, property)
				}
				setNesting(value, receiver, property)
			}

			// set
			let result = Reflect.set(target, property, value, receiver)

			// notify
			notifyPath(receiver, property, oldVal, value)

			return result
		},
	})

	proxyObjects.add(proxyObject)

	setNestingForExistingValues(proxyObject)

	return proxyObject
}

let setNestingForExistingValues = (object) => {
	Object.keys(object).forEach((key) => {
		let value = object[key]
		if (canObserve(value)) {
			setNesting(value, object, key)
		}
	})
}

export let canObserve = (value) => {
	return value != null && typeof value === 'object'
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

	// check if observable
	let ok = true
	let currentPath = ''
	path.split('.').reduce((obj, prop) => {
		if (!obj) {
			return
		}

		currentPath += (currentPath && '.') + prop
		obj = obj[prop]

		if (currentPath !== path && !proxyObjects.has(obj)) {
			throwError(
				`Trying to observe the path '${path}' on object`,
				object,
				`but value at '${currentPath[0] === '.' ? currentPath.slice(1) : currentPath}'`,
				obj,
				`is not a proxy-object`
			)
			ok = false
		}
		return obj
	}, object)

	if (ok) {
		observers.add(fn)
	}

	return () => {
		unobservePath(object, path, fn)
	}
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

export let getByPath = (obj, path) => {
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

export let notifyPath = (object, path, oldVal, newVal, stack = []) => {
	let observersByPath = observersByObject.get(object)
	if (observersByPath) {
		observersByPath.forEach((observers, observerPath) => {
			// exact match
			if (observerPath === path) {
				observers.forEach((fn) => {
					fn(oldVal, newVal, path)
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
			if (parent === object || stack.includes(parent)) {
				return
			}
			parentProps.forEach((parentProp) => {
				notifyPath(parent, `${parentProp}.${path}`, oldVal, newVal, [...stack, object])
			})
		})
	}
}

// note: path=a.b will match a.b and a.b.c observers
// note: nestedOnly=true, path=a.b will match a.b.c observer but will not a.b
let hasObservers = (object, path, nestedOnly = false, stack = []) => {
	let observersByPath = observersByObject.get(object)
	if (observersByPath) {
		for (let [p, observers] of observersByPath) {
			let hasNested = p.startsWith(path + '.')
			let has = nestedOnly ? hasNested : hasNested || p === path
			if (has && observers.size) {
				return true
			}
		}
	}

	if (nestedOnly) {
		return false
	}

	let parents = nesting.get(object)
	if (parents) {
		for (let [parent, parentProps] of parents) {
			if (parent === object || stack.includes(parent)) {
				continue
			}
			for (let parentProp of parentProps) {
				if (hasObservers(parent, `${parentProp}`, [...stack, object])) {
					return true
				}
			}
		}
	}
}

window.proxyObject = proxyObject
window.observePath = observePath
window.proxyObjects = proxyObjects
// window.observersByObject = observersByObject
window.hasObservers = hasObservers