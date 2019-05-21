import {observeHostProperty} from '../utils/property-observer.js'
import {observePath, unobservePath, canObserve} from '../data-flow/proxy-object.js'

export let observe = (host, path, fn) => {
	let pathAr = path.split('.')
	let localPath = pathAr.slice(1).join('.')
	let prop = pathAr[0]

	if (!localPath) {
		observeHostProperty(host, prop, fn)
		return
	}

	let pathObserver = (oldVal, newVal) => {
		fn(oldVal, newVal, path, host)
	}

	observeHostProperty(host, prop, (oldVal, newVal) => {
		if (oldVal !== newVal) {
			fn(oldVal, newVal, path, host)
		}
		if (canObserve(oldVal)) {
			unobservePath(oldVal, localPath, pathObserver)
		}
		if (canObserve(newVal)) {
			observePath(newVal, localPath, pathObserver)
		}
	})

	if (canObserve(host[prop])) {
		observePath(host[prop], localPath, pathObserver)
	}
}