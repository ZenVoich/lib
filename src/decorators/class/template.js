let canConstructStylesheets = true
try {
	new CSSStyleSheet
} catch (e) {
	canConstructStylesheets = false
}

let getStyleSheets = (host) => {
	if (host.constructor.__adoptedStyleSheets) {
		return host.constructor.__adoptedStyleSheets
	}
	let styleSheet = new CSSStyleSheet
	styleSheet.replaceSync(host.constructor.styles)
	host.constructor.__adoptedStyleSheets = [styleSheet]
	return host.constructor.__adoptedStyleSheets
}

export let template = (descriptor) => {
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()

					if (!this.shadowRoot) {
						this.attachShadow({mode: this.constructor.shadow || 'open'})
					}

					let template = this.constructor.template || ''

					if (this.constructor.styles) {
						if (canConstructStylesheets) {
							this.shadowRoot.adoptedStyleSheets = getStyleSheets(this)
						}
						else {
							template = `<style>${this.constructor.styles}</style>` + template
						}
					}

					if (this.constructor.__userTemplate) {
						this.__userTemplate = this.constructor.__userTemplate
						return
					}

					let templateEl = document.createElement('template')
					templateEl.innerHTML = template
					this.__userTemplate = templateEl
					this.constructor.__userTemplate = templateEl
					// if (template) {
					// 	this.shadowRoot.innerHTML = template
					// }
				}
			}
		}
	}
}