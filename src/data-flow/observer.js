import {observeHostProperty} from '../utils/property-observer.js'
import {observePath, unobservePath, canObserve} from '../data-flow/proxy-object.js'

export let observe = (host, path, fn, ok=false) => {
	let pathAr = path.split('.')
	let localPath = pathAr.slice(1).join('.')
	let prop = pathAr[0]

	if (!localPath) {
		return observeHostProperty(host, prop, fn)
	}

	let pathObserver = (oldVal, newVal) => {
		fn(oldVal, newVal, path, host)
	}

	let pathUnobserver

	let propObserver = (oldVal, newVal) => {
		if (oldVal === newVal) {
			return
		}

		fn(oldVal, newVal, path, host)

		if (pathUnobserver) {
			pathUnobserver()
			pathUnobserver = null
		}
		if (canObserve(newVal)) {
			pathUnobserver = observePath(newVal, localPath, pathObserver)
		}
	}

	let propUnobserver = observeHostProperty(host, prop, propObserver)

	if (canObserve(host[prop]) && !ok) {
		pathUnobserver = observePath(host[prop], localPath, pathObserver)
	}

	return () => {
		let pathAr = path.split('.')
		let localPath = pathAr.slice(1).join('.')
		let prop = pathAr[0]

		propUnobserver()

		if (pathUnobserver) {
			pathUnobserver()
		}
	}
}