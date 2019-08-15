export let findState = (states, prop) => {
	for (let i = states.length - 1; i >= 0; i--) {
		if (prop in states[i]) {
			return states[i]
		}
	}
	return states[0]
}