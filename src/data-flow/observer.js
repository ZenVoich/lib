import {observeHostProperty} from '../utils/property-observer.js'
import {observePath, unobservePath, isPrimitive} from '../data-flow/proxy-object.js'

export let observe = (host, path, fn) => {
	let pathAr = path.split('.')
	let localPath = pathAr.slice(1).join('.')
	let prop = pathAr[0]

	observeHostProperty(host, prop, (oldVal, newVal) => {
		// if (oldVal !== newVal) {
		// 	fn(oldVal, newVal)
		// }
		if (!localPath) {
			return
		}
		if (!isPrimitive(oldVal)) {
			unobservePath(oldVal, path, fn)
		}
		if (!isPrimitive(newVal)) {
			// console.log('ob', newVal, localPath, prop)
			observePath(newVal, localPath, fn)
		}
	})

	if (!isPrimitive(host[prop]) && localPath) {
		// console.trace('cur ob', host[prop], localPath, prop)
		observePath(host[prop], localPath, fn)
	}
}