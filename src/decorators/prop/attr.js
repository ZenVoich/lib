import {requestMicrotask} from '../../utils/microtask.js'
import {requestRender} from '../../utils/renderer.js'
import {toKebabCase, toCamelCase} from '../../utils/case.js'
import {observeProperty, addObserver} from '../../utils/property-observer.js'

export default (descriptor) => {
	if (descriptor.kind !== 'field' && !descriptor.descriptor.get) {
		throw '@attr decorator can only be applied to a property or getter'
	}

	let property = descriptor.key
	let attribute = toKebabCase(property)

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

					observeProperty(this, property)

					// on property change
					let propChanged = () => {
						requestRender(this, property, () => {
							this.__renderingProps.add(property)
							let value = this[property]
							if (!value) {
								this.removeAttribute(attribute)
							}
							else if (value === true) {
								this.setAttribute(attribute, '')
							}
							else {
								this.setAttribute(attribute, value)
							}
							this.__renderingProps.delete(property)
						})
					}
					addObserver(this, (prop, oldVal, newVal) => {
						if (prop !== property || this.__renderingProps.has(prop)) {
							return
						}
						propChanged()
					})

					// react on props already inited in constructor
					propChanged()
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