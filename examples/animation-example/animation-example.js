import {tag, markup} from '../../src/lib.js'

@tag('animation-example')
@markup(import('./animation-example.html'))
class AnimationExample extends HTMLElement {
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