import {define} from '../../src/lib.js'

@define('animation-example')
class AnimationExample extends HTMLElement {
	static template = import('./animation-example.html')
	static styles = import('./animation-example.css')

	shown = true

	toggle() {
		this.shown = !this.shown
	}
}