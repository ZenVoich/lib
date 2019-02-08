import PropertySourceExpression from '../source-expressions/property-source-expression.js';
import TargetExpression from './target-expression.js'

export default class EventTargetExpression extends TargetExpression {
	static parseType = 'attribute'
	static updatePhase = 'microtask'

	static parse(element, attribute, source) {
		if (!attribute.startsWith('on-')) {
			return
		}
		if (!(source instanceof PropertySourceExpression)) {
			console.error('Provide function name expression for "on-" binding', source)
			return
		}
		let target = new EventTargetExpression
		target.element = element
		target.eventName = attribute.slice(3)
		target.functionName = source.propertyName
		return target
	}

	element = null
	functionName = ''
	#currentHandler = null

	setValue(handler, state, host) {
		if (this.#currentHandler) {
			this.element.removeEventListener(this.eventName, this.#currentHandler)
		}
		if (typeof handler !== 'function') {
			console.error(`Trying to add '${this.functionName}' listener that doesn't exist on '${host.localName}' element`)
			return
		}
		this.#currentHandler = handler.bind(host)
		this.element.addEventListener(this.eventName, this.#currentHandler)
	}

	getValue() {}
}