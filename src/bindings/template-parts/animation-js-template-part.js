import {TemplatePart} from './template-part.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {sub, unsub} from '../../utils/pub-sub.js'

export class AnimationJsTemplatePart extends TemplatePart {
	static exclusive = false
	static attributes = ['#animation', '#animation-in', '#animation-out']
	static parseSkeleton(template, attrName, attrValue) {
		let animationSourceExpr = parseSourceExpressionMemoized(attrValue)
		if (!animationSourceExpr) {
			return
		}

		let type = attrName.split('-')[1]
		if (type === 'in') {
			type ='intro'
		}
		else if (type === 'out') {
			type ='outro'
		}

		return {
			type,
			animationSourceExpr,
			relatedPaths: new Set,
		}
	}

	relatedPaths

	#host
	#templateRoot
	#type = '' // '' | intro | outro
	#animationSourceExpr
	#activeAnimation // {phase, elapsed}
	#parentSubscribed = false

	constructor({type, animationSourceExpr, relatedPaths}, template) {
		super()

		this.#type = type
		this.#animationSourceExpr = animationSourceExpr
		this.relatedPaths = relatedPaths

		sub(template, (...args) => this._onAction(...args))
	}

	connect(host, {templateRoot} = {}) {
		if (!this.#parentSubscribed) {
			this.#parentSubscribed = true
			sub(this.parentTemplateRoot, (...args) => this._onAction(...args))
		}

		this.#host = host
		this.#templateRoot = templateRoot
	}

	disconnect() {
		this.#host = null
		this.#templateRoot = null
	}

	_onAction(action, fragmentContainer) {
		if (!fragmentContainer.simpleMode) {
			throw `#animation does not work on <template> tag`
		}
		if (this.#type && this.#activeAnimation) {
			this.#activeAnimation.finish()
			cancelAnimationFrame(this.#activeAnimation.raf)
			this.#activeAnimation = null
		}
		if (this.#type && this.#type !== action) {
			return
		}
		if (action === 'intro' || action === 'outro') {
			return new Promise((resolve) => {
				this._animate(action, resolve, fragmentContainer.element)
			})
		}
	}

	async _animate(phase, resolve, element) {
		// batch layout
		await 0

		if (this.#activeAnimation && !this.#type) {
			this.#activeAnimation = {phase, resolve}
		}

		this.#activeAnimation = {phase, resolve}

		let fn = this.#animationSourceExpr.getValue(this.#templateRoot.getStates())
		let {tick, finish = ()=>{}, duration = 300} = fn.call(this.#host, element)
		this.#activeAnimation.finish = finish

		let prevTime
		let elapsed = phase === 'intro' ? 0 : duration
		let firstRendered = false

		let loop = () => {
			let now = Date.now()
			let diff = now - (prevTime || Date.now())
			elapsed = this.#activeAnimation.phase === 'intro' ? elapsed + diff : elapsed - diff

			if (this.#activeAnimation.phase === 'intro' ? elapsed > duration : elapsed < 0) {
				finish()
				this.#activeAnimation.resolve()
				cancelAnimationFrame(this.#activeAnimation.raf)
				this.#activeAnimation = null
				return
			}

			tick(elapsed / duration)

			if (firstRendered) {
				prevTime = now
			}
			else {
				firstRendered = true
			}
			this.#activeAnimation.raf = requestAnimationFrame(loop)
		}
		loop()
	}
}