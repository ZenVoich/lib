export let getAllChildren = (root) => {
	let children = [...root.querySelectorAll('*')]
	if (root instanceof HTMLElement) {
		children.unshift(root)
	}
	return children
}

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
	fn || 	console.trace(fn)
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
}

let render = () => {
	let queueCopy = [...queue]
	queue = []
	renderQueued = false
	queueCopy.forEach((fn) => {
		fn()
	})
}

export let toHyphenCase = (str) => {
	return str.split(/([A-Z][^A-Z]*)/).filter(x => x).join('-').toLowerCase()
}

export let toCamelCase = (str) => {
	return str.split('-').map((x, i) => i && x ? x[0].toUpperCase() + x.slice(1) : x).join('')
}