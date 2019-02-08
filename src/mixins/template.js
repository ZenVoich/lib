export default (Class) => {
	return class extends Class {
		init() {
			super.init()
			this.attachShadow({mode: this.constructor.shadow || 'open'})
			let template = this.constructor.template || ''
			if (this.constructor.styles) {
				template = `<style>${this.constructor.styles}</style>` + template
			}
			if (template) {
				this.shadowRoot.innerHTML = template
			}
		}
	}
}