import perf from '../perf.js'

export default class Binding {
	direction = '' // downward | upward | two-way
	source = null // SourceExpression
	target = null // TargetExpression

	constructor(direction, source, target) {
		this.direction = direction
		this.source = source
		this.target = target
		this.phase = 'idle' // idle | push | pull
	}

	connect(host) {
		if (this.host) {
			return
		}
		this.host = host

		if (this.direction !== 'downward') {
			this.target.element.addEventListener(`${this.target.propertyName}-changed`, () => {
				// console.log('catch notify')
				this.pullValue(this.host)
			})
		}
	}

	pushValue(state, host) {
		if (this.phase !== 'idle') {
			// console.log('skip push')
			return
		}
		perf.markStart('binding.pushValue')

		if (state !== host) {
			perf.markStart('binding.pushValue: merge states')

			let newState = {}
			Object.getOwnPropertyNames(host).forEach((prop) => {
				newState[prop] = host[prop]
			})
			newState.localName = host.localName
			state = Object.assign(newState, state)
			perf.markEnd('binding.pushValue: merge states')
		}

		if (state && this.direction !== 'upward') {
			// console.log('push', this.phase, this)
			this.phase = 'push'
			this.target.setValue(this.source.getValue(state), state, host)
			Promise.resolve().then(() => {
				this.phase = 'idle'
			})
		}

		perf.markEnd('binding.pushValue')
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

	dispose() {}
}