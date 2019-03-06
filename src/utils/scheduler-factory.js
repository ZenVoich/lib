export let createScheduler = (schedule) => {
	let queue = []
	let queued = false
	let enqueue = (fn) => {
		queue.push(fn)
		if (queued) {
			return
		}
		schedule(flush)
		queued = true
	}

	let flush = () => {
		let queueCopy = [...queue]
		queue = []
		queued = false
		queueCopy.forEach((fn) => {
			fn()
		})
	}

	let debouncers = new Set
	let debounce = (id, fn) => {
		if (id && debouncers.has(id)) {
			return id
		}
		if (!id) {
			id = Symbol()
		}
		debouncers.add(id)
		enqueue(() => {
			debouncers.delete(id)
			fn()
		})
		return id
	}

	let requestsByHost = new WeakMap

	// debounce fn by id
	let request = (host, id, fn) => {
		let requests = requestsByHost.get(host)
		if (requests && requests.has(id)) {
			return
		}
		if (!requests) {
			requests = new Set
			requestsByHost.set(host, requests)
		}
		requests.add(id)

		debounce(id, () => {
			requests.delete(id)
			fn()
			if (!requests.size) {
				flushAfterCallbacks(host)
			}
		})
	}

	let afterHandlersByHost = new WeakMap
	let afterNext = (host, fn) => {
		let afterHandlers = afterHandlersByHost.get(host)
		if (!afterHandlers) {
			afterHandlers = new Set
			afterHandlersByHost.set(host, afterHandlers)
		}
		afterHandlers.add(fn)
	}

	let waitForNext = (host) => {
		return new Promise((resolve) => {
			afterNext(host, resolve)
		})
	}

	let flushAfterCallbacks = (host) => {
		let afterHandlers = afterHandlersByHost.get(host)
		if (afterHandlers) {
			new Set(afterHandlers).forEach((fn) => {
				afterHandlers.delete(fn)
				fn()
			})
		}
		afterHandlers
	}

	return {enqueue, debounce, request, afterNext, waitForNext}
}