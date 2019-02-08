import {queueRender, toHyphenCase} from '../../helpers.js'

export default (def) => {
	if (def.kind !== 'field') {
		throw '@attr decorator can only be applied to a property'
	}

	let property = def.key
	let attribute = toHyphenCase(property)

	def.finisher = (Class) => {
		return class extends Class {
			static get observedAttributes() {
				let attrs = super.observedAttributes || []
				attrs.push(property)
				return attrs
			}
			_renderQueued = false

			constructor() {
				super()
				this.observeProperty(property)
			}

			propertyChangedCallback(prop, oldVal, newVal) {
				super.propertyChangedCallback(prop, oldVal, newVal)

				if (this._renderQueued) {
					return
				}

				this._renderQueued = true
				queueRender(() => {
					if (prop !== property) {
						return
					}
					let value = this[property]
					if (!value) {
						this.removeAttribute(attribute)
					}
					else if (value === true) {
						this.setAttribute(attribute, '')
					}
					else {
						this.setAttribute(attribute, '')
					}
					this._renderQueued = false
				})
			}

			attributeChangedCallback(attr, oldVal, newVal) {
				if (this._renderQueued) {
					return
				}
				if (newVal === null) {
					if (typeof this[property] === 'boolean') {
						this[property] = false
					} else {
						this[property] = ''
					}
				}
				else if (newVal === '') {
					if (typeof this[property] === 'boolean') {
						this[property] = true
					} else {
						this[property] = ''
					}
				}
				else {
					if (typeof this[property] === 'boolean') {
						this[property] = newVal !== 'false'
					} else {
						this[property] = newVal
					}
				}
			}
		}
	}

	return def
}