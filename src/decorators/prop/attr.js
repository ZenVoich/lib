import {debounceMicrotask, debounceRender} from '../../utils/scheduler.js'
import {toHyphenCase} from '../../utils/case.js'
import {observeProperty, addObserver, removeObserver, notifyChange} from '../../utils/property-observer.js'

export default (descriptor) => {
	if (descriptor.kind !== 'field') {
		throw '@attr decorator can only be applied to a property'
	}

	let property = descriptor.key
	let attribute = toHyphenCase(property)

	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				static get observedAttributes() {
					let attrs = super.observedAttributes || []
					attrs.push(property)
					return attrs
				}

				_rendering = false

				constructor() {
					super()

					observeProperty(this, property)

					// on property change
					let propChanged = () => {
						this._renderDebouncer = debounceRender(this._renderDebouncer, () => {
							this._rendering = true
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
							this._rendering = false
						})
					}
					addObserver(this, (prop, oldVal, newVal) => {
						if (this._rendering || prop !== property) {
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

					if (this._rendering) {
						return
					}

					this._updateDebouncer = debounceMicrotask(this._updateDebouncer, () => {
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