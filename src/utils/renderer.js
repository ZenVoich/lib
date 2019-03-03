import {debounceRender} from './scheduler.js'

let requestedRendersByHost = new WeakMap

// debounce fn by id
export let requestRender = (host, id, fn) => {
	let renders = requestedRendersByHost.get(host)
	if (renders && renders.has(id)) {
		return
	}
	if (!renders) {
		renders = new Set
		requestedRendersByHost.set(host, renders)
	}
	renders.add(id)

	debounceRender(id, () => {
		renders.delete(id)
		fn()
		if (!renders.size) {
			flushAfterRenderCallbacks(host)
		}
	})
}

let afterRenderHandlersByHost = new WeakMap
export let afterNextRender = (host, fn) => {
	let afterRenderHandlers = afterRenderHandlersByHost.get(host)
	if (!afterRenderHandlers) {
		afterRenderHandlers = new Set
		afterRenderHandlersByHost.set(host, afterRenderHandlers)
	}
	afterRenderHandlers.add(fn)
}

export let waitForNextRender = (host) => {
	return new Promise((resolve) => {
		afterNextRender(host, resolve)
	})
}

let flushAfterRenderCallbacks = (host) => {
	let afterRenderHandlers = afterRenderHandlersByHost.get(host)
	if (afterRenderHandlers) {
		new Set(afterRenderHandlers).forEach((fn) => {
			afterRenderHandlers.delete(fn)
			fn()
		})
	}
	afterRenderHandlers
}