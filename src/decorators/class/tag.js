import {bindings} from './bindings.js'
import {initTemplate} from './init-template.js'

export let tag = (name) => {
	return (descriptor) => {
		return {
			...descriptor,
			finisher(Class) {
				Promise.all([Class.markup, Class.styles]).then(async () => {
					@bindings
					@initTemplate
					class NewClass extends Class {
						connectedCallback() {
							super.connectedCallback && super.connectedCallback()
							this.__isConnected = true
						}
						disconnectedCallback() {
							super.disconnectedCallback && super.disconnectedCallback()
							this.__isConnected = false
						}
					}

					NewClass.__staticMarkup = await Class.markup
					NewClass.__staticStyles = await Class.styles

					customElements.define(name, NewClass)
				})
			}
		}
	}
}