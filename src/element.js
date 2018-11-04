import Initial from './mixins/initial.js'
import Template from './mixins/template.js'
import Bindings from './mixins/bindings.js'
import Listeners from './mixins/listeners.js'
import PropertyObserver from './mixins/property-observer.js'


let mix = (mixins, Class) => {
	return mixins.reduce((Class, mixin) => {
		return mixin(Class)
	}, Class)
}

export default mix([Initial, Template, Listeners, PropertyObserver, Bindings], HTMLElement)