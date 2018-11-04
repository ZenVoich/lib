import {getAllChildren} from '../helpers.js'

export default (Class) => {
	return class extends Class {
		ready() {
			super.ready()
			if (!this.shadowRoot || !this.shadowRoot.innerHTML) {
				return
			}
			getAllChildren(this.shadowRoot).forEach((el) =>{
				[...el.attributes].forEach((attr) =>
					this.handleAttr(this, el, attr.name, attr.value.slice(2, -2))
				)
			})
		}

		handleAttr(host, el, name, value) {
			if (!name.startsWith('on-')) {
				return
			}
			let fn = host[value]
			if (typeof fn != 'function') {
				console.warn(`Trying to add '${value}' listener that doesn't exist on '${host.localName}' element`)
			}
			else {
				el.addEventListener(name.replace('on-', ''), e => fn.call(host, e))
			}
		}
	}
}