import {observeHostProperty} from '../utils/property-observer.js'
// import {observePath, canObserve} from '../data-flow/proxy-object.js'
import {observePath, canObserve} from '../data-flow/observe-path.js'

let observeNew = observePath

let observeOld = (host, state, path, fn, ok=false) => {
	let pathAr = path.split('.')
	let localPath = pathAr.slice(1).join('.')
	let prop = pathAr[0]

	if (!localPath) {
		return observeHostProperty(host, prop, fn)
	}

	let pathObserver = (oldVal, newVal) => {
		fn(oldVal, newVal, path, state, host)
	}

	let pathUnobserver

	let propObserver = (oldVal, newVal) => {
		if (oldVal === newVal) {
			return
		}

		fn(oldVal, newVal, path, state, host)

		if (pathUnobserver) {
			pathUnobserver()
			pathUnobserver = null
		}
		if (canObserve(newVal)) {
			pathUnobserver = observePath(newVal, localPath, pathObserver)
		}
	}

	let propUnobserver = observeHostProperty(host, prop, propObserver)

	if (canObserve(state[prop]) && !ok) {
		pathUnobserver = observePath(state[prop], localPath, pathObserver)
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

export {observeNew as observe}
// export {observeOld as observe}