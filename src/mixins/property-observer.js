export default (Class) => {
	return class extends Class {
		#observedProps = new Set
		#propertiesObservers = new Set

		ready() {
			super.ready()
			let observedProperties = this.constructor.observedProperties || []
			observedProperties.forEach((prop) => {
				this.observeProperty(prop)
			})
		}

		observeProperty(prop) {
			if (this.#observedProps.has(prop)) {
				return
			}
			this.#observedProps.add(prop)

			let value = this[prop]
			Object.defineProperty(this, prop, {
				set(val) {
					let oldVal = value
					value = val
					// if ((['boolean', 'number', 'string'].includes(typeof oldVal) || ['boolean', 'number', 'string'].includes(typeof val)) && val === oldVal) {
					// 	return
					// }
					this.propertyChangedCallback(prop, oldVal, val)
				},
				get() {
					return value
				},
			})

			if (value !== undefined) {
				this.propertyChangedCallback(prop, undefined, value)
			}
		}

		addPropertiesObserver(fn) {
			this.#propertiesObservers.add(fn)
		}

		removePropertiesObserver(fn) {
			this.#propertiesObservers.delete(fn)
		}

		propertyChangedCallback(prop, oldVal, newVal) {
			if (super.propertyChangedCallback) {
				super.propertyChangedCallback(prop, oldVal, newVal)
			}
			this.#propertiesObservers.forEach((fn) => {
				fn(prop, oldVal, newVal)
			})
		}
	}
}