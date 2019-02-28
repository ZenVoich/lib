import bindings from './bindings.js'

export default (name) => {
	return (descriptor) => {
		return {
			...descriptor,
			finisher(Class) {
				customElements.define(name, @bindings class extends Class {})
			}
		}
	}
}