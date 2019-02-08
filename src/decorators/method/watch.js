import {debounceMicrotask} from '../../helpers.js'

export default (...props) => {
	return (def) => {
		if (def.kind !== 'method') {
			throw '@watch decorator can only be applied to a method'
		}

		let propsInfo = []
		props.forEach((prop) => {
			let info = {prop: prop, mandatory: true}
			if (prop.endsWith('?')) {
				info.mandatory = false
				info.prop = prop.slice(0, -1)
			}
			propsInfo.push(info)
		})

		def.finisher = (Class) => {
			return class extends Class {
				_watchUpdateDebouncer

				constructor() {
					super()
					propsInfo.forEach((info) => {
						if (!this.observeProperty) {
							console.log(this)
						}
						this.observeProperty(info.prop)
					})
				}

				propertyChangedCallback(prop, oldVal, newVal) {
					this._watchUpdateDebouncer = debounceMicrotask(this._watchUpdateDebouncer, () => {
						let isPropRelated = propsInfo.find((info) => {
							return prop === info.prop
						})
						let canCall = isPropRelated && propsInfo.every((info) => {
							if (info.mandatory) {
								return this[info.prop] !== null
							}
							return true
						})

						if (canCall) {
							if (propsInfo.length === 1) {
								this[def.key].call(this, oldVal)
							}
							else {
								let oldValues = propsInfo.map((info) => {
									return info.prop === prop ? oldVal : this[info.prop]
								})
								this[def.key].call(this, ...oldValues)
							}
						}
					})

					super.propertyChangedCallback(prop, oldVal, newVal)
				}
			}
		}

		return def
	}
}