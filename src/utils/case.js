let hyphenCaseRegex = /([A-Z][^A-Z]*)/
export let toHyphenCase = (str) => {
	return str.split(hyphenCaseRegex).filter(x => x).join('-').toLowerCase()
}

export let toCamelCase = (str) => {
	return str.split('-').map((x, i) => i && x ? x[0].toUpperCase() + x.slice(1) : x).join('')
}