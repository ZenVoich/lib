import {TemplatePart} from './template-part.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {sub, unsub} from '../../utils/pub-sub.js'

export class TransitionTemplatePart extends TemplatePart {
	static exclusive = false
	static attributes = ['#transition']
	static parseSkeleton(template, attrName, attrValue) {
		return {
			name: attrValue,
			relatedPaths: new Set,
		}
	}

	relatedPaths

	#host
	#name = ''

	#resolve
	#parentSubscribed = false

	constructor({name, relatedPaths}, template) {
		super()

		this.#name = name
		this.relatedPaths = relatedPaths

		sub(template, (...args) => this._onAction(...args))
	}

	connect(host) {
		if (!this.#parentSubscribed) {
			this.#parentSubscribed = true
			sub(this.parentTemplateRoot, (...args) => this._onAction(...args))
		}

		this.#host = host
	}

	disconnect() {
		this.#host = null
	}

	_onAction(action, fragmentContainer) {
		if (!fragmentContainer.simpleMode) {
			throw `#transition does not work on <template> tag`
		}
		if (action === 'intro' || action === 'outro') {
			return new Promise((resolve) => {
				this._start(resolve, fragmentContainer.element)
				this['_' + action](fragmentContainer.element)
			})
		}
	}

	_start(resolve, element) {
		if (this.#resolve) {
			this.#resolve = resolve
			return
		}
		this.#resolve = resolve

		element.classList.add(`${this.#name}-active`)

		let transitionStarted = false
		element.addEventListener('transitionstart', (e) => {
			transitionStarted = true
		}, {once: true})

		let onTransitionEnd = (e) => {
			if (e.target !== element) {
				return
			}
			this._finish(element)
		}

		// if transition was not started
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (!transitionStarted) {
					element.removeEventListener('transitionend', onTransitionEnd, {once: true})
					this._finish(element)
				}
			})
		})

		element.addEventListener('transitionend', onTransitionEnd, {once: true})
	}

	_finish(element) {
		this.#resolve()
		this.#resolve = null

		element.classList.remove(`${this.#name}-active`)
		// element.classList.remove(`${this.#name}-in-active`)
		// element.classList.remove(`${this.#name}-in-start`)
		element.classList.remove(`${this.#name}-in`)
		// element.classList.remove(`${this.#name}-out-active`)
		// element.classList.remove(`${this.#name}-out-start`)
		element.classList.remove(`${this.#name}-out`)
	}

	_intro(element) {
		element.classList.add(`${this.#name}-out`)
		// element.classList.add(`${this.#name}-in-active`)
		// element.classList.add(`${this.#name}-in-start`)
		requestAnimationFrame(() => {
			element.classList.remove(`${this.#name}-out`)
			// element.classList.remove(`${this.#name}-in-start`)
			element.classList.add(`${this.#name}-in`)
		})
	}

	_outro(element) {
		element.classList.add(`${this.#name}-in`)
		// element.classList.add(`${this.#name}-out-active`)
		// element.classList.add(`${this.#name}-out-start`)
		requestAnimationFrame(() => {
			element.classList.remove(`${this.#name}-in`)
			// element.classList.remove(`${this.#name}-out-start`)
			element.classList.add(`${this.#name}-out`)
		})
	}
}