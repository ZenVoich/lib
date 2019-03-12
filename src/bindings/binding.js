import perf from '../utils/perf.js'

export default class Binding {
	direction = '' // downward | upward | two-way
	source = null // SourceExpression
	target = null // TargetExpression
	phase = 'idle' // idle | push | pull
	#backwardListener = () => {
		// console.log('catch notify')
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

	pushValue(state) {
		if (this.phase !== 'idle') {
			// console.log('skip push')
			return
		}
		perf.markStart('binding.pushValue:' + this.target.constructor.name)

		if (state && this.direction !== 'upward') {
			// console.log('push', this.phase, this)
			this.phase = 'push'
			this.target.setValue(this.source.getValue(state), state)
			Promise.resolve().then(() => {
				this.phase = 'idle'
			})
		}

		perf.markEnd('binding.pushValue:' + this.target.constructor.name)
	}

	pullValue(state) {
		if (this.phase !== 'idle') {
			// console.log('skip pull')
			return
		}
		// console.log('pull', this.phase)

		if (state && this.direction !== 'downward') {
			this.phase = 'pull'
			this.source.setValue(state, this.target.getValue())
			Promise.resolve().then(() => {
				this.phase = 'idle'
			})
		}
	}

	isPropRelated(prop) {
		return this.source.isPropRelated(prop)
	}
}