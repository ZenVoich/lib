let observedPropsByComponent = new WeakMap
let observersByComponent = new WeakMap

export let observeProperty = (host, prop) => {
	let observedProps = observedPropsByComponent.get(host)
	if (observedProps && observedProps.has(prop)) {
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
			notifyChange(host, prop, oldVal, val)
		},
		get() {
			return getter ? getter.call(host) : value
		},
	})

	if (value !== undefined) {
		notifyChange(host, prop, undefined, value)
	}
}

export let addObserver = (host, fn) => {
	let observers = observersByComponent.get(host)
	if (!observers) {
		observers = new Set
		observersByComponent.set(host, observers)
	}
	observers.add(fn)
}

export let removeObserver = (host, fn) => {
	let observers = observersByComponent.get(host)
	if (observers) {
		observers.delete(fn)
	}
}

export let notifyChange = (host, prop, oldVal, val) => {
	let observers = observersByComponent.get(host)
	if (observers) {
		observers.forEach((fn) => {
			fn(prop, oldVal, val)
		})
	}
}