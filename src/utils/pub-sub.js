let handlersByTarget = new WeakMap

export let sub = (target, handler) => {
	let handlers = handlersByTarget.get(target)
	if (!handlers) {
		handlers = new Set
		handlersByTarget.set(target, handlers)
	}
	handlers.add(handler)
}

export let unsub = (target, handler) => {
	let handlers = handlersByTarget.get(target)
	if (handlers) {
		handlers.delete(handler)
	}
}

export let pub = (target, data) => {
	let handlers = handlersByTarget.get(target)
	if (handlers) {
		return Promise.all([...handlers].map((handler) => handler(data)))
	}
	return Promise.resolve()
}