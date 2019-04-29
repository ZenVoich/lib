import {TemplateRoot} from '../src/bindings/template-root.js'

export let createTemplateRoot = (html, state) => {
	let template = document.createElement('template')
	template.innerHTML = html
	let templateRoot = TemplateRoot.parse(template)
	templateRoot.connect(document)
	templateRoot.update(state, true)
	return templateRoot
}

export let assertRender = (html, state, expected) => {
	let tr = createTemplateRoot(html, state)
	// if (tr.template.innerHTML === expected) {
	// 	console.log(`%c ${html}`, 'color: hsl(100, 50%, 50%);', state)
	// }
	// else {
	// 	console.error(`'${html}'`, 'with state', state, 'renders', `'${tr.template.innerHTML}'`, 'expected', `'${expected}'`)
	// }
	console.assert(tr.template.innerHTML === expected, `'${html}'`, 'with state', state, 'renders', `'${tr.template.innerHTML}'`, 'expected', `'${expected}'`)
}

export let assertElement = (html, state, fn) => {
	let tr = createTemplateRoot(html, state)

	let expected = fn(tr.content.firstElementChild, tr)

	console.assert(!expected, `'${html}'`, 'with state', state, expected)
}