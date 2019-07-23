import {define} from '../../src/lib.js'

@define('animation-example')
class AnimationExample extends HTMLElement {
	static template = import('./animation-example.html')

	shown = true

	toggle() {
		this.shown = !this.shown
	}
}