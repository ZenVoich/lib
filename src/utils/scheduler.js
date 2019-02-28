// microtask
export let queueMicrotask = (fn) => {
	Promise.resolve().then(fn)
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
	queueMicrotask(() => {
		activeDebouncers.delete(id)
		fn()
	})
	return id
}

// animation frame
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

let renderDebouncers = new Set
export let debounceRender = (id, fn) => {
	if (id && renderDebouncers.has(id)) {
		return id
	}
	if (!id) {
		id = Symbol()
	}
	renderDebouncers.add(id)
	queueRender(() => {
		renderDebouncers.delete(id)
		fn()
	})
	return id
}

let render = () => {
	let queueCopy = [...queue]
	queue = []
	renderQueued = false
	queueCopy.forEach((fn) => {
		fn()
	})
}