let observedPropsByComponent = new WeakMap
let observersByComponent = new WeakMap

export let observeHostProperty = (host, property, fn) => {
	// console.log('ob')
	observeProperty(host, property)
	let observer = (prop, oldVal, newVal) => {
		if (prop === property) {
			fn(oldVal, newVal, property, host, host)
		}
	}
	addObserver(host, observer)

	return () => {
		// unobserveHostProperty(host, property, observer)
		removeObserver(host, observer)
	}
}

// export let unobserveHostProperty = (host, property, fn) => {
// 	removeObserver(host, fn)
// }

export let notifyHostProperty = (host, prop, oldVal, newVal) => {
	let observers = observersByComponent.get(host)
	if (observers) {
		observers.forEach((fn) => {
			fn(prop, oldVal, newVal)
		})
	}
}

let addObserver = (host, fn) => {
	let observers = observersByComponent.get(host)
	if (!observers) {
		observers = new Set
		observersByComponent.set(host, observers)
	}
	observers.add(fn)
}

let removeObserver = (host, fn) => {
	let observers = observersByComponent.get(host)
	if (observers) {
		observers.delete(fn)
	}
}

let observeProperty = (host, prop) => {
	let observedProps = observedPropsByComponent.get(host)
	if (observedProps && observedProps.has(prop)) {
		return
	}

	if (typeof host[prop] === 'function') {
		return
	}

	if (!observedProps) {
		observedProps = new Set
		observedPropsByComponent.set(host, observedProps)
	}
	observedProps.add(prop)

	let setter = host.__lookupSetter__(prop)
	let getter = host.__lookupGetter__(prop)
	let value = setter || getter ? null : host[prop]

	Object.defineProperty(host, prop, {
		set(val) {
			let oldVal = getter ? getter.call(host) : value
			// if ((['boolean', 'number', 'string'].includes(typeof oldVal) || ['boolean', 'number', 'string'].includes(typeof val)) && val === oldVal) {
			// 	return
			// }
			if (setter) {
				setter.call(host, val)
			}
			else {
				value = val
			}
			notifyHostProperty(host, prop, oldVal, val)
		},
		get() {
			return getter ? getter.call(host) : value
		},
	})

	if (value !== undefined) {
		notifyHostProperty(host, prop, undefined, value)
	}
}

window.observedPropsByComponent = observedPropsByComponent
window.observersByComponent = observersByComponent