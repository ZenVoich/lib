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

	let value = host[prop]
	Object.defineProperty(host, prop, {
		set(val) {
			let oldVal = value
			value = val
			// if ((['boolean', 'number', 'string'].includes(typeof oldVal) || ['boolean', 'number', 'string'].includes(typeof val)) && val === oldVal) {
			// 	return
			// }
			notifyChange(host, prop, oldVal, val)
		},
		get() {
			return value
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