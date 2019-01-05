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
				constructor() {
					super()
					propsInfo.forEach((info) => {
						this.observeProperty(info.prop)
					})
				}

				propertyChangedCallback(prop, oldVal, newVal) {
					let isPropRelated = propsInfo.find((info) => {
						return prop == info.prop
					})
					if (!isPropRelated) {
						return
					}

					let canCall = propsInfo.every((info) => {
						if (info.mandatory) {
							return this[info.prop] != null
						}
						return true
					})

					if (canCall) {
						this[def.key].call(this)
					}
				}
			}
		}

		return def
	}
}