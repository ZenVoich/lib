import define from '../../src/decorators/class/define.js'

import template from './animation-example.html'
import styles from './animation-example.css'

@define('animation-example')
class AnimationExample extends HTMLElement {
	static template = template
	static styles = styles

	shown = true

	toggle() {
		this.shown = !this.shown
	}
}