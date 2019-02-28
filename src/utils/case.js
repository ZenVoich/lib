export let toHyphenCase = (str) => {
	return str.split(/([A-Z][^A-Z]*)/).filter(x => x).join('-').toLowerCase()
}

export let toCamelCase = (str) => {
	return str.split('-').map((x, i) => i && x ? x[0].toUpperCase() + x.slice(1) : x).join('')
}