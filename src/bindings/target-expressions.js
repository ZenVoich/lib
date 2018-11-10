export class PropertyTargetExpression {
	element = null
	propertyName = ''

	constructor({element, propertyName} = {}) {
		this.element = element
		this.propertyName = propertyName
	}

	setValue(value) {
		this.element[this.propertyName] = value
	}

	getValue() {
		return this.element[this.propertyName]
	}
}

export class AttributeTargetExpression {
	element = null
	attributeName = ''

	constructor({element, attributeName} = {}) {
		this.element = element
		this.attributeName = attributeName
	}

	setValue(value) {
		if (value === undefined || value === null || value === false) {
			this.element.removeAttribute(this.attributeName)
		} else {
			this.element.setAttribute(this.attributeName, value)
		}
	}

	getValue() {
		return this.element.getAttribute(this.attributeName)
	}
}

export class NodeTargetExpression {
	node = null

	constructor({node} = {}) {
		this.node = node
	}

	setValue(value) {
		this.node.textContent = value
	}

	getValue() {
		return this.node.textContent
	}
}

export class EventTargetExpression {
	element = null
	functionName = ''
	#currentHandler = null

	constructor({element, eventName, functionName} = {}) {
		this.element = element
		this.eventName = eventName
		this.functionName = functionName
	}

	setValue(handler, state) {
		if (this.#currentHandler) {
			console.log('unsub')
			this.element.removeEventListener(this.eventName, this.#currentHandler)
		}
		if (typeof handler != 'function') {
			console.error(`Trying to add '${this.functionName}' listener that doesn't exist on '${state.localName}' element`)
			return
		}
		this.#currentHandler = handler.bind(state)
		this.element.addEventListener(this.eventName, this.#currentHandler)
	}

	getValue() {}
}


export class ShowHideTargetExpression {
	element = null
	type = ''

	constructor({element, type} = {}) {
		this.element = element
		this.type = type
	}

	setValue(value) {
		let show = this.type == 'show' ? !!value : !value

		if (show) {
			this.element.style.removeProperty('display')
		}
		else {
			this.element.style.setProperty('display', 'none', 'important')
		}
	}

	getValue() {}
}