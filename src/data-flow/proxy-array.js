import {notifyProp} from './observe-prop.js'

let proxyArrays = new WeakSet

export class ProxyArray {
	constructor() {
		return proxyObject(this)
	}
}

export let proxyArray = (object) => {
	if (proxyArrays.has(object)) {
		return object
	}

	let proxyObject = new Proxy(object, {
		set(target, property, value, receiver) {
			let oldVal = Reflect.get(target, property, receiver)
			let result = Reflect.set(target, property, value, receiver)
			notifyProp(receiver, 'length', oldVal, value)
			return result
		},
	})

	proxyArrays.add(proxyObject)

	return proxyObject
}