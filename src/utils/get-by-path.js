export let getByPath = (obj, path) => {
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

window.getByPath = getByPath