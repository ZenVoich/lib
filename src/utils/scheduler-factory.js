export let createScheduler = (schedule) => {
	let queue = []
	let queued = false
	let enqueue = (fn) => {
		let index = queue.push(fn) - 1
		let dequeue = () => {
			queue.splice(index, 1)
		}
		if (queued) {
			return dequeue
		}
		schedule(flush)
		queued = true
		return dequeue
	}

	let flush = () => {
		let queueCopy = [...queue]
		queue = []
		queued = false
		queueCopy.forEach((fn) => {
			fn()
		})

		// let fn
		// let queueCopy = [...queue]
		// queued = false
		// while (fn = queueCopy.shift()) {
		// 	fn()
		// 	if (navigator.scheduling && navigator.scheduling.isInputPending() && window.xx) {
		// 		queued || schedule(flush)
		// 		break
		// 	}
		// }
	}

	let requestsByHost = new WeakMap
	let request = (host, id, fn) => {
		let requests = requestsByHost.get(host)
		if (requests && requests.has(id)) {
			return () => {}
		}
		if (!requests) {
			requests = new Set
			requestsByHost.set(host, requests)
		}
		requests.add(id)

		return enqueue(() => {
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
	}

	return {enqueue, request, afterNext, waitForNext}
}