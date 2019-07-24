import {define} from '../../src/lib.js'

@define('animation-example')
class AnimationExample extends HTMLElement {
	static template = import('./animation-example.html')

	shown = false

	toggle() {
		this.shown = !this.shown
	}

	typewriter(element) {
		let text = element.textContent;

		return {
			duration: text.length * 50,
			tick(t) {
				let i = ~~(text.length * t);
				element.textContent = text.slice(0, i);
			},
			finish() {
				element.textContent = text;
			},
		};
	}
}