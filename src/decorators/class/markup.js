export let markup = (markup) => {
	return (descriptor) => {
		return {
			...descriptor,
			finisher(Class) {
				Class.markup = markup
			}
		}
	}
}