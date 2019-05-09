import {bindings} from './bindings.js'
import {template} from './template.js'

export let define = (name) => {
	return (descriptor) => {
		return {
			...descriptor,
			finisher(Class) {
				Promise.all([Class.template, Class.styles]).then(async () => {
					@bindings
					@template
					class NewClass extends Class {}

					NewClass.__staticTemplate = await Class.template
					NewClass.__staticStyles = await Class.styles

					customElements.define(name, NewClass)
				})

			}
		}
	}
}