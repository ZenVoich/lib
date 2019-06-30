export let dirtyCheck = (descriptor) => {
	return {
		...descriptor,
		finisher(Class) {
			Class.dirtyCheck = true
		}
	}
}