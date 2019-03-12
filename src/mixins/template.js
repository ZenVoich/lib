let canConstructStylesheets = true
try {
	new CSSStyleSheet
} catch (e) {
	canConstructStylesheets = false
}

let getStyleSheets = (host) => {
	if (host.constructor.adoptedStyleSheets) {
		return host.constructor.adoptedStyleSheets
	}
	let styleSheet = new CSSStyleSheet
	styleSheet.replaceSync(host.constructor.styles)
	host.constructor.adoptedStyleSheets = [styleSheet]
	return host.constructor.adoptedStyleSheets
}

export default (Class) => {
	return class extends Class {
		constructor() {
			super()
			this.attachShadow({mode: this.constructor.shadow || 'open'})
			let template = this.constructor.template || ''
			if (this.constructor.styles) {
				if (canConstructStylesheets) {
					this.shadowRoot.adoptedStyleSheets = getStyleSheets(this)
				}
				else {
					template = `<style>${this.constructor.styles}</style>` + template
				}
			}
			if (template) {
				this.shadowRoot.innerHTML = template
			}
		}
	}
}