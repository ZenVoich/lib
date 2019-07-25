import {TemplatePart} from './template-part.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {sub, unsub} from '../../utils/pub-sub.js'

let tempEl = document.createElement('div')
tempEl.style.display = 'none'

let stringToMs = (str) => {
	return parseFloat(str) * (str.endsWith('ms') ? 1 : 1000)
}

export class AnimationCssTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (!['#animation', '#animation-in', '#animation-out'].includes(attribute)) {
			return
		}

		let animationString = template.getAttribute(attribute)
		if (!animationString) {
			return
		}

		template.removeAttribute(attribute)

		return {
			type: attribute.split('-')[1],
			animationString,
			relatedPaths: new Set,
		}
	}

	relatedPaths

	#host
	#type = '' // '' | in | out
	#animationString = ''
	#animationName = ''

	#timing
	#keyframes
	#animationByElement = new WeakMap

	constructor({type, animationString, relatedPaths}, template) {
		super()

		this.#type = type
		this.#animationString = animationString
		this.relatedPaths = relatedPaths

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
		let animation = this.#animationByElement.get(element)
		if (!animation) {
			let timing = this.getTiming()
			animation = element.animate(this.getKeyframes(), timing)
			this.#animationByElement.set(element, animation)
		}
		animation.onfinish = resolve
		animation.playbackRate = phase === 'intro' ? 1 : -1
		animation.play()
	}

	getTiming() {
		if (this.#timing) {
			return this.#timing
		}
		this.#host.shadowRoot.appendChild(tempEl)
		tempEl.style.animation = this.#animationString

		let computedStyle = getComputedStyle(tempEl)

		// linear by default
		let easing = computedStyle.animationTimingFunction
		if (easing === 'ease' && !this.#animationString.includes('ease')) {
			easing = 'linear'
		}

		this.#animationName = computedStyle.animationName

		this.#timing = {
			delay: stringToMs(computedStyle.animationDelay),
			duration: stringToMs(computedStyle.animationDuration),
			easing: easing,
		}

		tempEl.remove()

		return this.#timing
	}

	getKeyframes() {
		if (this.#keyframes !== null) {
			return this.#keyframes
		}

		let sheets = [...(this.#host.shadowRoot.adoptedStyleSheets || [])]
		![...this.#host.shadowRoot.querySelectorAll('style')].forEach((style) => {
			sheets.push(style.sheet)
		})

		let keyframeRule
		sheets.find((sheet) => {
			return [...sheet.cssRules].find((rule) => {
				if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === this.#animationName) {
					keyframeRule = rule
					return true
				}
			})
		})

		if (!keyframeRule) {
			this.#keyframes = false
			return
		}

		this.#keyframes = [...keyframeRule.cssRules].map((rule) => {
			let offset
			if (rule.keyText === 'from') {
				offset = 0
			}
			else if (rule.keyText === 'to') {
				offset = 1
			}
			else {
				offset = parseFloat(rule.keyText) / 100
			}

			let keyframe = {offset}
			![...rule.style].forEach((key) => {
				let value = rule.style[key]
				if (value && isNaN(parseInt(key))) {
					keyframe[key] = value
				}
			})
			return keyframe
		})

		return this.#keyframes
	}
}