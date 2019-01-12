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

let queue = []
let renderQueued = false
export let queueRender = (fn) => {
	queue.push(fn)
	if (renderQueued) {
		return
	}
	requestAnimationFrame(render)
	renderQueued = true
}

let render = () => {
	let queueCopy = [...queue]
	queue = []
	renderQueued = false
	queueCopy.forEach((fn) => {
		fn()
	})
}