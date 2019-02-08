import {debounceMicrotask} from '../../helpers.js'

export default (def) => {
	if (def.kind !== 'field') {
		throw '@notify decorator can only be applied to a property'
	}

	def.finisher = (Class) => {
		return class extends Class {
			_notifyUpdateDebouncer
			_isInited

			constructor() {
				super()
				this.observeProperty(def.key)
			}

			init() {
				super.init()
				this._isInited = true
			}

			propertyChangedCallback(prop, oldVal, newVal) {
				super.propertyChangedCallback(prop, oldVal, newVal)

				// skip default value
				if (!this._isInited) {
					return
				}

				this._notifyUpdateDebouncer = debounceMicrotask(this._notifyUpdateDebouncer, () => {
					if (prop !== def.key) {
						return
					}
					this.dispatchEvent(new CustomEvent(`${prop}-changed`))
				})
			}
		}
	}

	return def
}