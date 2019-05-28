import {perf} from '../utils/perf.js'
import {enqueueMicrotask} from '../utils/microtask.js'

export class Binding {
	direction = '' // downward | upward | two-way
	source = null // SourceExpression
	target = null // TargetExpression
	phase = 'idle' // idle | push | pull

	#backwardListener = () => {
		this.pullValue(this.host)
	}

	constructor(direction, source, target) {
		this.direction = direction
		this.source = source
		this.target = target
	}

	connect(host) {
		if (this.host) {
			return
		}
		this.host = host

		if (this.direction !== 'downward') {
			this.target.element.addEventListener(`${this.target.propertyName}-changed`, this.#backwardListener)
		}
		this.target.connect(host)
	}

	disconnect() {
		if (!this.host) {
			return
		}
		this.host = null

		if (this.direction !== 'downward') {
			this.target.element.removeEventListener(`${this.target.propertyName}-changed`, this.#backwardListener)
		}
		this.target.disconnect()
	}

	isPathRelated(path) {
		return this.source.relatedPaths.has(path)
	}

	pushValue(state) {
		if (this.phase !== 'idle') {
			return
		}
		perf.markStart('binding.pushValue:' + this.target.constructor.name)

		if (state && this.direction !== 'upward') {
			this.phase = 'push'
			this.target.setValue(this.source.getValue(state), state)
			enqueueMicrotask(() => {
				this.phase = 'idle'
			})
		}

		perf.markEnd('binding.pushValue:' + this.target.constructor.name)
	}

	pullValue(state) {
		if (this.phase !== 'idle') {
			return
		}

		if (state && this.direction !== 'downward') {
			this.phase = 'pull'
			this.source.setValue(state, this.target.getValue())
			enqueueMicrotask(() => {
				this.phase = 'idle'
			})
		}
	}
}