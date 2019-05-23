import {observeHostProperty, unobserveHostProperty} from '../utils/property-observer.js'
import {observePath, unobservePath, canObserve} from '../data-flow/proxy-object.js'

export let observe = (host, path, fn) => {
	let pathAr = path.split('.')
	let localPath = pathAr.slice(1).join('.')
	let prop = pathAr[0]

	if (!localPath) {
		return observeHostProperty(host, prop, fn)
	}

	let pathObserver = (oldVal, newVal) => {
		fn(oldVal, newVal, path, host)
	}

	let observer = (oldVal, newVal) => {
		if (oldVal !== newVal) {
			fn(oldVal, newVal, path, host)
		}
		if (canObserve(oldVal)) {
			unobservePath(oldVal, localPath, pathObserver)
		}
		if (canObserve(newVal)) {
			observePath(newVal, localPath, pathObserver)
		}
	}

	observeHostProperty(host, prop, observer)

	if (canObserve(host[prop])) {
		observePath(host[prop], localPath, pathObserver)
	}

	return () => {
		let pathAr = path.split('.')
		let localPath = pathAr.slice(1).join('.')
		let prop = pathAr[0]

		unobserveHostProperty(host, prop, observer)

		if (!localPath) {
			return
		}

		if (canObserve(host[prop])) {
			unobservePath(host[prop], localPath, pathObserver)
		}
	}
}