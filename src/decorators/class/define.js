import bindings from './bindings.js'
import template from './template.js'

export default (name) => {
	return (descriptor) => {
		return {
			...descriptor,
			finisher(Class) {
				@bindings
				@template
				class NewClass extends Class {}
				customElements.define(name, NewClass)
			}
		}
	}
}