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
	eventName = ''
	#currentHandler = null

	constructor({element, eventName} = {}) {
		this.element = element
		this.eventName = eventName
	}

	setValue(handler) {
		if (this.#currentHandler) {
			this.element.removeEventListener(this.eventName, this.#currentHandler)
		}
		this.element.addEventListener(this.eventName, handler)
		this.#currentHandler = handler
	}

	getValue() {}
}