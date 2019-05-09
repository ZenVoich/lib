import {define} from './define.js'
import {bindings} from './bindings.js'

export let component = (tag) => {
	return (descriptor) => {
		return {
			...descriptor,
			finisher(Class) {
				@define(tag)
				@bindings
				class Component extends Class {}
				return Component
			}
		}
	}
}