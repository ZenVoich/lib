import {requestMicrotask} from '../../utils/microtask.js'
import {requestRender} from '../../utils/renderer.js'
import {toKebabCase, toCamelCase} from '../../utils/case.js'
import {observeHostProperty} from '../../utils/property-observer.js'

export let attr = (descriptor) => {
	if (descriptor.kind !== 'field' && !descriptor.descriptor.get) {
		throw '@attr decorator can only be applied to a property or getter'
	}

	let property = descriptor.key
	let attribute = toKebabCase(property)

	let propObserver = (oldVal, newVal, prop, host) => {
		if (host.__renderingProps.has(prop)) {
			return
		}
		requestRender(host, prop, () => {
			host.__renderingProps.add(prop)
			let value = host[prop]
			if (!value) {
				host.removeAttribute(attribute)
			}
			else if (value === true) {
				host.setAttribute(attribute, '')
			}
			else {
				host.setAttribute(attribute, value)
			}
			host.__renderingProps.delete(prop)
		})
	}

	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				static get observedAttributes() {
					let attrs = super.observedAttributes || []
					attrs.push(attribute)
					return attrs
				}

				__renderingProps = new Set

				constructor() {
					super()

					// on property change
					observeHostProperty(this, property, propObserver)

					// react on props already inited in constructor
					propObserver(null, null, property, this)
				}

				// on attribute change
				attributeChangedCallback(attr, oldVal, newVal) {
					super.attributeChangedCallback && super.attributeChangedCallback(attr, oldVal, newVal)

					if (attr !== attribute || this.__renderingProps.has(toCamelCase(attr))) {
						return
					}

					requestMicrotask(this, attr, () => {
						let type = typeof this[property]
						if (newVal === null) {
							if (type === 'boolean') {
								this[property] = false
							}
							else if (type === 'number') {
								this[property] = 0
							}
							else {
								this[property] = ''
							}
						}
						else if (newVal === '') {
							if (type === 'boolean') {
								this[property] = true
							}
							else if (type === 'number') {
								this[property] = 0
							}
							else {
								this[property] = ''
							}
						}
						else {
							if (type === 'boolean') {
								this[property] = newVal !== 'false'
							}
							else if (type === 'number') {
								this[property] = +newVal
							}
							else {
								this[property] = newVal
							}
						}
					})
				}
			}
		}
	}
}