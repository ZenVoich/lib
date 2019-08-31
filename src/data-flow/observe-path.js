import {observeProp} from './observe-prop.js'
import {getByPath} from '../utils/get-by-path.js'

export let observePath = (object, path, fn) => {
	let pathAr = path.split('.')
	let unobserveList = []

	let observeFromIndex = (fromIndex, checkInitial = false) => {
		pathAr.slice(fromIndex).forEach((prop, index) => {
			let i = fromIndex + index
			let currPath = pathAr.slice(0, i).join('.')
			let currObject = getByPath(object, currPath)

			if (!canObserve(currObject)) {
				return
			}

			let isLast = i === pathAr.length - 1

			if (pathAr[i] === '*') {
				let itemPath = pathAr.slice(i + 1).join('.')
				let unobserversByItem = new WeakMap

				let observeItem = (item) => {
					let unobserve = observePath(item, itemPath, fn)
					unobserversByItem.set(item, unobserve)
				}
				let unobserveItem = (item) => {
					let unobserve = unobserversByItem.get(item)
					unobserve && unobserve()
				}

				currObject.forEach(observeItem)

				if (checkInitial) {
					fn()
				}

				let unobserveProp = observeProp(currObject, 'length', (removedItems, addedItems) => {
					removedItems.forEach(unobserveItem)
					addedItems.forEach(observeItem)
					fn()
				})
				unobserveList[i] = () => {
					unobserveProp()
					currObject.forEach(unobserveItem)
				}
				return
			}

			if (isLast && checkInitial) {
				let lastPropVal = getByPath(object, path)
				if (lastPropVal !== undefined) {
					fn(undefined, lastPropVal, path, object)
				}
			}

			let observer = (oldVal, newVal) => {
				if (isLast) {
					fn(oldVal, newVal, path, object)
					return
				}
				// if (oldVal === newVal) {
				// 	return
				// }
				if (canObserve(newVal)) {
					if (unobserveList.length > i + 1) {
						unobserveFromIndex(i + 1, oldVal)
					}
					observeFromIndex(i + 1, true)
				}
				else {
					unobserveFromIndex(i + 1, oldVal)
				}
			}

			unobserveList[i] = observeProp(currObject, prop, observer)
		})
	}

	let unobserveFromIndex = (index, oldVal) => {
		unobserveList.splice(index).forEach((unobserve) => {
			unobserve()
		})
		let path = pathAr.slice(index).join('.')
		let lastOldVal = getByPath(oldVal, path)
		if (lastOldVal !== undefined) {
			fn(lastOldVal, undefined, path, object)
		}
	}

	observeFromIndex(0)

	return () => {
		unobserveFromIndex(0)
	}
}

export let canObserve = (value) => {
	return value !== null && typeof value === 'object'
}