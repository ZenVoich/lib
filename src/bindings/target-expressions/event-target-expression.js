import {PropertySourceExpression} from '../source-expressions/property-source-expression.js'
import {CallSourceExpression} from '../source-expressions/call-source-expression.js'
import {ValueSourceExpression} from '../source-expressions/value-source-expression.js'
import {TargetExpression} from './target-expression.js'

export class EventTargetExpression extends TargetExpression {
	static parseType = 'attribute'
	static updatePhase = 'microtask'

	static parseSkeleton(attribute, source) {
		if (!attribute.startsWith('@')) {
			return
		}
		return {
			eventName: attribute.slice(1),
			sourceExpr: source,
		}
	}

	#element
	#eventName

	#sourceExpr

	#currentHandler
	#isConnected

	constructor({eventName, sourceExpr}, element) {
		super()
		this.#element = element
		this.#eventName = eventName
		this.#sourceExpr = sourceExpr
	}

	connect(host, templateRoot) {
		if (this.#isConnected) {
			return
		}
		this.#isConnected = true

		let fn = this.#sourceExpr.getValue(templateRoot.getStates())
		if (typeof fn !== 'function') {
			console.error(`Trying to add listener that doesn't exist on '${host.localName}' element`, this.#sourceExpr)
			return
		}

		this.#currentHandler = fn.bind(host)
		this.#element.addEventListener(this.#eventName, this.#currentHandler)
	}


	disconnect() {
		if (!this.#isConnected) {
			return
		}
		this.#isConnected = false
		this.#element.removeEventListener(this.#eventName, this.#currentHandler)
	}

	setValue(handler) {}

	getValue() {}
}