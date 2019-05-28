import {FragmentContainer} from './fragment-container.js'
import {observePath, unobservePath, canObserve} from '../../data-flow/proxy-object.js'
import {observe} from '../../data-flow/observer.js'
import {perf} from '../../utils/perf.js'

export class RepeatObject {
	host
	item
	templateRoot
	fragmentContainer
	as
	#unobservers = []

	constructor(templateRoot, as) {
		this.templateRoot = templateRoot
		this.as = as
		this.fragmentContainer = new FragmentContainer(templateRoot.content)
	}

	connect(host, item) {
		if (this.host || this.#unobservers.length) {
			throw 'Already connected'
		}

		this.host = host
		this.item = item

		this.templateRoot.connect(this.host, false)

		if (!canObserve(item)) {
			return
		}

		let relatedPaths = new Set
		this.templateRoot.relatedPaths.forEach((path) => {
			if (path.startsWith(`${this.as}.`)) {
				let unobserver = observePath(item, path.split(`${this.as}.`)[1], (oldVal, newVal) => {
					this.templateRoot.updateProp(this.createState(this.host), path)
				})
				this.#unobservers.push(unobserver)
			}
			else {
				let unobserver = observe(this.host, path, () => {
					this.templateRoot.updateProp(this.createState(this.host), path)
				}, true)
				this.#unobservers.push(unobserver)
			}
		})
	}

	disconnect() {
		if (!this.host) {
			return
		}
		this.templateRoot.disconnect()
		this.#unobservers.forEach((unobserver) => {
			unobserver()
		})
		this.#unobservers = []
		this.host = null
		// this.item = null
	}

	remove() {
		this.disconnect()
		this.fragmentContainer.remove()
		this.item = null
	}

	createState(state) {
		return RepeatObject.mergeStates(RepeatObject.prepareState(state), {[this.as]: this.item})
	}

	update(state, immediate) {
		state = this.createState(state)
		this.templateRoot.update(state, immediate)
	}

	updateWithState(state, immediate) {
		this.templateRoot.update(state, immediate)
	}

	static prepareState(state) {
		let hostState = {}
		Object.getOwnPropertyNames(state).forEach((prop) => {
			hostState[prop] = state[prop]
		})
		hostState.localName = state.localName
		return hostState
	}

	static mergeStates(state, itemState) {
		perf.markStart('repeat-template-part: merge states')
		itemState = Object.assign({}, state, itemState)
		perf.markEnd('repeat-template-part: merge states')
		return itemState
	}
}