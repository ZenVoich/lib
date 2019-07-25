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

		return {
			type: attribute.split('-')[1],
			animationSourceExpr,
		}
	}

	static fromSkeleton(skeleton, template) {
		return new AnimationJsTemplatePart({template, ...skeleton})
	}

	relatedPaths = new Set

	#host
	#type = '' // '' | in | out
	#animationSourceExpr
	#activeAnimation // {phase, elapsed}

	constructor({template, type, animationSourceExpr}) {
		super()

		this.#type = type
		this.#animationSourceExpr = animationSourceExpr

		sub(template, (action, fragmentContainer) => {
			if (!fragmentContainer.simpleMode) {
				throw `#animation does not work on <template> tag`
			}
			if (action === 'intro' || action === 'outro') {
				return new Promise((resolve) => {
					this.animate(action, resolve, fragmentContainer.element)
				})
			}
		})
	}

	connect(host) {
		this.#host = host
	}

	disconnect() {
		this.#host = null
	}

	animate(phase, resolve, element) {
		if (this.#activeAnimation) {
			this.#activeAnimation = {phase, resolve}
			return
		}

		this.#activeAnimation = {phase, resolve}

		let fn = this.#animationSourceExpr.getValue(this.#host)
		let {tick, finish = ()=>{}, duration = 300} = fn.call(this.#host, element)

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
			requestAnimationFrame(loop)
		}
		loop()
	}
}