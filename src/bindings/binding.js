import {perf} from '../utils/perf.js'
import {enqueueMicrotask} from '../utils/microtask.js'

export class Binding {
	#host
	#direction = '' // downward | upward | two-way
	#source // SourceExpression
	#target // TargetExpression

	#phase = 'idle' // idle | push | pull
	#backwardEvent
	#backwardListener

	constructor(direction, source, target) {
		this.#direction = direction
		this.#source = source
		this.#target = target

		if (this.#direction !== 'downward') {
			if (['input', 'textarea', 'select'].includes(this.#target.element.localName)) {
				this.#backwardEvent = 'input'
			}
			else if (['innerHTML', 'innerText', 'textContent'].includes(this.#target.propertyName)) {
				this.#backwardEvent = 'input'
			}
			else {
				this.#backwardEvent = `${this.#target.propertyName}-changed`
			}
			this.#backwardListener = () => {
				this.pullValue(this.#host)
			}
		}
	}

	get relatedPaths() {
		return this.#source.relatedPaths
	}

	get source() {
		return this.#source
	}

	get targetUpdatePhase() {
		return this.#target.updatePhase || this.#target.constructor.updatePhase
	}

	connect(host) {
		if (this.#host) {
			return
		}
		this.#host = host

		if (this.#direction !== 'downward') {
			this.#target.element.addEventListener(this.#backwardEvent, this.#backwardListener)
		}
		this.#target.connect(host)
	}

	disconnect() {
		if (!this.#host) {
			return
		}
		this.#host = null

		if (this.#direction !== 'downward') {
			this.#target.element.removeEventListener(this.#backwardEvent, this.#backwardListener)
		}
		this.#target.disconnect()
	}

	isPathRelated(path) {
		return this.#source.relatedPaths.has(path)
	}

	pushValue(state, ignoreUndefined) {
		if (this.#phase !== 'idle') {
			return
		}
		perf.markStart('binding.pushValue:' + this.#target.constructor.name)

		if (state && this.#direction !== 'upward') {
			let value = this.#source.getValue(state)

			// do not rewrite initial props of target elements if the value is undefined and this is the initial render
			if (ignoreUndefined && this.#direction !== 'downward' && value === undefined && !['innerHTML', 'innerText', 'textContent'].includes(this.#target.propertyName)) {
				return
			}

			this.#phase = 'push'

			this.#target.setValue(value, state)

			enqueueMicrotask(() => {
				this.#phase = 'idle'
			})
		}

		perf.markEnd('binding.pushValue:' + this.#target.constructor.name)
	}

	pullValue(state) {
		if (this.#phase !== 'idle') {
			return
		}

		if (state && this.#direction !== 'downward') {
			this.#phase = 'pull'
			this.#source.setValue(state, this.#target.getValue())
			enqueueMicrotask(() => {
				this.#phase = 'idle'
			})
		}
	}
}