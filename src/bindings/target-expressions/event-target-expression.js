import PropertySourceExpression from '../source-expressions/property-source-expression.js';
import TargetExpression from './target-expression.js'

export default class EventTargetExpression extends TargetExpression {
	static parseType = 'attribute'
	static updatePhase = 'microtask'

	static parseSkeleton(element, attribute, source) {
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

		return {
			class: this,
			eventName: attribute.slice(3),
			functionName: source.propertyName,
		}
	}

	static fromSkeleton(skeleton, element) {
		let target = new EventTargetExpression
		target.element = element
		target.eventName = skeleton.eventName
		target.functionName = skeleton.functionName
		return target
	}

	isConnected = false
	element = null
	eventName = ''
	functionName = ''
	#currentHandler = null

	connect(host) {
		if (this.isConnected) {
			return
		}
		this.isConnected = true
		if (typeof host[this.functionName] !== 'function') {
			console.error(`Trying to add '${this.functionName}' listener that doesn't exist on '${host.localName}' element`)
			return
		}
		this.#currentHandler = host[this.functionName].bind(host)
		this.element.addEventListener(this.eventName, this.#currentHandler)
	}


	disconnect() {
		if (!this.isConnected) {
			return
		}
		this.isConnected = false
		this.element.removeEventListener(this.eventName, this.#currentHandler)
	}

	setValue(handler) {}

	getValue() {}
}