import {observeProp} from './observe-prop.js'

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

let getByPath = (obj, path) => {
	path = path.split('.')
	let check = () => {
		let prop = path.shift()
		if (!prop) {
			return
		}
		if (obj == null) {
			obj = undefined
			return
		}
		obj = obj[prop]
		check()
	}
	check()
	return obj
}


// let ar = [{x: 1}]
// observePath(ar, 'length', (old, val) => {
// 	console.log('ar.length changed', old, val)
// })
// observePath(ar, '1', (old, val) => {
// 	console.log('ar.1 changed', old, val)
// })
// observePath(ar, '1.x', (old, val) => {
// 	console.log('ar.1.x changed', old, val)
// })
// observePath(ar, '*.x', (old, val) => {
// 	console.log('ar.*.x changed', old, val)
// })
// ar.push({x: 2})
// ar[1] = {x: 3}
// ar[1] = {x: 33}
// ar[1].x = 4
// ar.unshift({x: 11})
// console.log(ar)


// let ar = [{x: 1}]
// observePath(ar, 'length', (old, val) => {
// 	console.log('ar.length changed', old, val)
// })
// ar.push({x: 2})
// ar.unshift({x: 3})
// ar.pop()
// ar.pop()
// ar.pop()
// ar.pop()
// ar.pop()
// console.log(ar)


// let a = {b: {x: 1}}

// observePath(a, 'b.x', (old, val) => {
// 	console.log('a.b.x changed', old, val)
// })

// window.getByPath = getByPath

// a.b.x = 9
// a.b.x = 5
// let b = a.b
// a.b = undefined
// a.b = false
// a.b = 999
// a.b = 555
// a.b = 5555
// a.b = 5556
// a.b = 5557
// a.b = undefined
// b.x = 555
// a.b = {x: 0}
// a.b.x = 1

window.observePath = observePath