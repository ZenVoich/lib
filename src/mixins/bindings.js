import {Bindings} from '../bindings/bindings.js'
import perf from '../perf.js'

export default (Class) => {
	return class extends Class {
		init() {
			super.init()

			if (!this.shadowRoot || !this.shadowRoot.innerHTML) {
				return
			}
			perf.markStart('bindings: parse')
			this.bindings = new Bindings(this.shadowRoot)
			perf.markEnd('bindings: parse')
			this.bindings.connect(this)
			perf.markStart('bindings: initial update')
			this.bindings.update()
			perf.markEnd('bindings: initial update')
		}
	}
}