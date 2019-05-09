export let debounce = (delay = 0) => {
	return (descriptor) => {
		if (descriptor.kind !== 'method' && descriptor.descriptor.value) {
			throw '@debounce decorator can only be applied to a method'
		}

		let method = descriptor.descriptor.value
		let timeout

		let value = function(...args) {
			clearTimeout(timeout)
			timeout = setTimeout(() => {
				method.call(this, ...args)
			}, delay)
		}

		let {enumerable, configurable, writable} = descriptor.descriptor
		descriptor.extras = [{
			kind: 'method',
			key: descriptor.key,
			placement: 'own',
			descriptor: {enumerable, configurable, writable, value},
		}]

		return descriptor

		// return {
		// 	...descriptor,
		// 	finisher(Class) {
		// 		return class extends Class {
		// 			[descriptor.key](...args) {
		// 				clearTimeout(timeout)
		// 				timeout = setTimeout(() => {
		// 					method.call(this, ...args)
		// 				}, delay)
		// 			}
		// 		}
		// 	}
		// }
	}
}