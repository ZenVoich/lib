export let styles = (styles) => {
	return (descriptor) => {
		return {
			...descriptor,
			finisher(Class) {
				Class.styles = styles
			}
		}
	}
}