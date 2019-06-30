let canConstructStylesheets = true
try {
	new CSSStyleSheet
} catch (e) {
	canConstructStylesheets = false
}

let getStyleSheets = (host, styles) => {
	if (host.constructor.__adoptedStyleSheets) {
		return host.constructor.__adoptedStyleSheets
	}
	let styleSheet = new CSSStyleSheet
	styleSheet.replaceSync(styles)
	host.constructor.__adoptedStyleSheets = [styleSheet]
	return host.constructor.__adoptedStyleSheets
}

export let initTemplate = (descriptor) => {
	return {
		...descriptor,
		finisher(Class) {
			return class extends Class {
				constructor() {
					super()

					if (!this.shadowRoot) {
						this.attachShadow({mode: this.constructor.shadow || 'open'})
					}

					let template = this.constructor.__staticTemplate || ''

					if (this.constructor.__staticStyles) {
						if (canConstructStylesheets) {
							this.shadowRoot.adoptedStyleSheets = getStyleSheets(this, this.constructor.__staticStyles)
						}
						else {
							template = `<style>${this.constructor.__staticStyles}</style>` + template
						}
					}

					if (this.constructor.__templateElement) {
						this.__templateElement = this.constructor.__templateElement
						return
					}

					let templateEl = document.createElement('template')
					templateEl.innerHTML = template
					this.__templateElement = templateEl
					this.constructor.__templateElement = templateEl
				}
			}
		}
	}
}