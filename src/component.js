export class Component extends HTMLElement {
	constructor() {
		super()
		if (!this.shadowRoot) {
			this.attachShadow({mode: this.constructor.shadow || 'open'})
		}
	}
}