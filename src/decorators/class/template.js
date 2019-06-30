export let template = (template) => {
	return (descriptor) => {
		return {
			...descriptor,
			finisher(Class) {
				Class.template = template
			}
		}
	}
}