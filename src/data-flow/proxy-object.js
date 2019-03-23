window.observedPathsByObject = new WeakMap
window.observersByObject = new WeakMap

export class ProxyObject {
	constructor() {
		return proxyObject(this)
	}
}

export let proxyObject = (object) => {
	if (object.__isProxyObject__) {
		return object
	}
	return new Proxy(object, {
		set(target, property, value, receiver) {
			let observedPaths = observedPathsByObject.get(receiver)
			if (observedPaths) {
				let isRelated = observedPaths.find((path) => {
					return path[0] === property
				})
				if (isRelated) {
					notifyChange(receiver, property, target[property], value)
				}
			}
			return Reflect.set(target, property, value, receiver)
		},
		get(target, prop, receiver) {
			if (prop === '__isProxyObject__') {
				return true;
			}
			let value = Reflect.get(target, prop, receiver)
			if (typeof value === 'object' && value !== null && !value.__isProxyObject__) {
				return proxyObject(value)
			}
			return value
		},
	})
}

export let observePath = (object, path) => {
	if (!object.__isProxyObject__) {
		return
	}
	let observedPaths = observedPathsByObject.get(object)
	if (!observedPaths) {
		observedPaths = []
		observedPathsByObject.set(object, observedPaths)
	}
	let has = observedPaths.find((p) => {
		return p.flat(Infinity).join('.') === path
	})
	if (!has) {
		let pathArray = []
		let lastArray = pathArray
		path.split('.').forEach((chunk) => {
			let arr = [chunk]
			lastArray.push(arr)
			lastArray = arr
		})
		observedPaths.push(pathArray[0])
	}
}

export let addObserver = (host, fn) => {
	let observers = observersByObject.get(host)
	if (!observers) {
		observers = new Set
		observersByObject.set(host, observers)
	}
	observers.add(fn)
}

export let removeObserver = (host, fn) => {
	let observers = observersByObject.get(host)
	if (observers) {
		observers.delete(fn)
	}
}

export let notifyChange = (proxy, prop, oldVal, val) => {
	// todo: найти observers в других местах
	let observers = observersByObject.get(proxy)
	if (observers) {
		observers.forEach((fn) => {
			fn(prop, oldVal, val)
		})
	}
}


class Obj extends ProxyObject {
	constructor() {
		super()
		this.prop = 1
	}
}

class P1 extends ProxyObject {
	constructor() {
		super(obj)
		this.p1Obj = obj || new Obj
	}
}

class P2 extends ProxyObject {
	constructor(obj) {
		super()
		this.nested = {
			obj: obj || new Obj,
		}
	}
}

class P3 {
	constructor(obj) {
		this.o = obj
	}
}

window.obj = new Obj
window.p1 = new P1(obj)
window.p2 = new P2(obj)
window.p3 = proxyObject(new P3(obj))

// obj
observePath(obj, 'prop')
addObserver(obj, (path, old, val) => {
	console.log('obj', path, old, val)
})

// p1
observePath(p1, 'p1Obj')
observePath(p1, 'p1Obj.prop')
addObserver(p1, (path, old, val) => {
	console.log('p1', path, old, val)
})

// p2
observePath(p2, 'nested.obj')
observePath(p2, 'nested.obj.prop')
addObserver(p2, (path, old, val) => {
	console.log('p2', path, old, val)
})

// p3
observePath(p3, 'nested.obj')
observePath(p3, 'nested.obj.prop')
addObserver(p3, (path, old, val) => {
	console.log('p3', path, old, val)
})