export let getAllChildren = (root) => {
	let children = [...root.querySelectorAll('*')]
	if (root instanceof HTMLElement) {
		children.unshift(root)
	}
	return children
}

export let debouncer = {
	activeDebouncers: new Set,
	microtask(id, fn) {
		if (id && this.activeDebouncers.has(id)) {
			return id
		}
		if (!id) {
			id = Symbol()
		}
		this.activeDebouncers.add(id)
		Promise.resolve().then(() => {
			fn()
			this.activeDebouncers.delete(id)
		})
		return id
	}
}