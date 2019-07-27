import {TemplatePart} from './template-part.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {sub, unsub} from '../../utils/pub-sub.js'

export class AnimationJsTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (!['#animation', '#animation-in', '#animation-out'].includes(attribute)) {
			return
		}

		let animationSourceExpr = parseSourceExpressionMemoized(template.getAttribute(attribute))

		if (!animationSourceExpr) {
			return
		}

		template.removeAttribute(attribute)

		let type = attribute.split('-')[1]
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

	_animate(phase, resolve, element) {
		if (this.#activeAnimation && !this.#type) {
			this.#activeAnimation = {phase, resolve}
		}

		this.#activeAnimation = {phase, resolve}

		let fn = this.#animationSourceExpr.getValue(this.#host)
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