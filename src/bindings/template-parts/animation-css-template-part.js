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

		let type = attribute.split('-')[1]
		if (type === 'in') {
			type ='intro'
		}
		else if (type === 'out') {
			type ='outro'
		}

		return {
			type,
			animationString,
			relatedPaths: new Set,
		}
	}

	relatedPaths

	#host
	#type = '' // '' | intro | outro
	#animationString = ''
	#animationName = ''

	#timing
	#keyframes
	#animation
	#parentSubscribed = false

	constructor({type, animationString, relatedPaths}, template) {
		super()

		this.#type = type
		this.#animationString = animationString
		this.relatedPaths = relatedPaths

		sub(template, (...args) => this.onAction(...args))
	}

	connect(host) {
		if (!this.#parentSubscribed) {
			this.#parentSubscribed = true
			sub(this.parentTemplateRoot, (...args) => this.onAction(...args))
		}

		this.#host = host
	}

	disconnect() {
		this.#host = null
	}

	onAction(action, fragmentContainer) {
		if (!fragmentContainer.simpleMode) {
			throw `#animation does not work on <template> tag`
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
		if (!this.#animation) {
			let timing = this._getTiming()
			this.#animation = element.animate(this._getKeyframes(), timing)
		}

		// element.getAnimations().forEach((animation) => {
		// 	if (animation !== this.#animation) {
		// 		console.log(this.#animation.onfinish)
		// 		if (phase == 'intro') {
		// 			animation.cancel()
		// 		}
		// 		else {
		// 			animation.dispatchEvent(new CustomEvent('do-not-resolve'))
		// 		}
		// 		this.#animation.currentTime = 0
		// 	}
		// })

		// this.#animation.addEventListener('do-not-resolve', () => {
		// 	this.#animation.onfinish = null
		// })

		this.#animation.onfinish = resolve
		this.#animation.playbackRate = phase === 'intro' ? 1 : -1
		this.#animation.play()
	}

	_getTiming() {
		if (this.#timing) {
			return this.#timing
		}
		this.#host.shadowRoot.appendChild(tempEl)
		tempEl.style.animation = this.#animationString

		let computedStyle = getComputedStyle(tempEl)
		let easing = computedStyle.animationTimingFunction

		this.#animationName = computedStyle.animationName

		this.#timing = {
			delay: stringToMs(computedStyle.animationDelay),
			duration: stringToMs(computedStyle.animationDuration),
			easing: easing,
			// composite: 'add',
			// iterationComposite: 'accumulate',
		}

		tempEl.remove()

		return this.#timing
	}

	_getKeyframes() {
		if (this.#keyframes) {
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