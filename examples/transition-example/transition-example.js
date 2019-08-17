import {tag, markup} from '../../src/lib.js'

@tag('transition-example')
@markup(import('./transition-example.html'))
export default class extends HTMLElement {
	shown = false

	toggle() {
		this.shown = !this.shown
	}
}