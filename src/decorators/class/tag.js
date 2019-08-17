import {bindings} from './bindings.js'
import {initTemplate} from './init-template.js'

export let tag = (name) => {
	return (descriptor) => {
		return {
			...descriptor,
			finisher(Class) {
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

				(async () => {
					let getString = async (stringOrModule) => {
						if (!stringOrModule || typeof stringOrModule === 'string') {
							return stringOrModule
						}
						let mod = await stringOrModule
						if (typeof mod === 'string') {
							return mod
						}
						return mod.default
					}

					NewClass.__staticMarkup = await getString(Class.markup)
					NewClass.__staticStyles = await getString(Class.styles)

					customElements.define(name, NewClass)
				})()
			}
		}
	}
}