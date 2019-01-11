export let getAllChildren = (root) => {
	let children = [...root.querySelectorAll('*')]
	if (root instanceof HTMLElement) {
		children.unshift(root)
	}
	return children
}

let activeDebouncers = new Set
export let debounceMicrotask = (id, fn) => {
	if (id && activeDebouncers.has(id)) {
		return id
	}
	if (!id) {
		id = Symbol()
	}
	activeDebouncers.add(id)
	Promise.resolve().then(() => {
		fn()
		activeDebouncers.delete(id)
	})
	return id
}

// export let queueRender = requestAnimationFrame

let queue = []
export let queueRender = (fn) => {
	queue.push(fn)
}

let loop = () => {
	requestAnimationFrame(() => {
		queue.forEach((fn) => {
			fn()
		})
		queue = []
		loop()
	})
}
loop()