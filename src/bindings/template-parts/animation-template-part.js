import {TemplatePart} from './template-part.js'
import {FragmentContainer} from './fragment-container.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'
import {sub, unsub} from '../../utils/pub-sub.js'

let tempEl = document.createElement('div')

let stringToMs = (str) => {
	return parseFloat(str) * (str.endsWith('ms') ? 1 : 1000)
}

export class AnimationTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (!['#animation', '#animation-in', '#animation-out'].includes(attribute)) {
			return
		}

		let animation = template.getAttribute(attribute)
		template.removeAttribute(attribute)

		tempEl.style.animation = animation

		// linear by default
		let easing = tempEl.style.animationTimingFunction
		if (easing === 'ease' && !animation.includes('ease')) {
			easing = 'linear'
		}

		return {
			type: attribute.split('-')[1],
			animationName: tempEl.style.animationName,
			timing: {
				delay: stringToMs(tempEl.style.animationDelay),
				duration: stringToMs(tempEl.style.animationDuration),
				easing: easing,
			},
		}
	}

	static fromSkeleton(skeleton, template) {
		let part = new AnimationTemplatePart(template)
		part.type = skeleton.type
		part.animationName = skeleton.animationName
		part.timing = skeleton.timing
		return part
	}

	host = null
	template = null
	element = null

	type = '' // '' | in | out
	animationName = ''
	timing = null

	phase = 'idle' // idle | intro | outro
	animation = null
	keyframes = null
	resolveIntro = null
	resolveOutro = null

	constructor(template) {
		super()
		this.template = template
		this.element = template.content.children[0]
		// this.elements = [...template.content.children]

		sub(this.template, (action) => {
			return this[action]()
		})

		this.onAnimationEnd = () => {
			this.element.style.animation = ''
			resolve()
			this.phase = 'idle'
		}
	}

	connect(host) {
		this.host = host
	}

	disconnect() {
		this.host = null
	}

	intro() {
		this.animate('intro')
		return new Promise((resolve) => {
			this.resolveIntro = resolve
		})
	}

	outro() {
		this.animate('outro')
		return new Promise((resolve) => {
			this.resolveOutro = resolve
		})
	}

	animate(phase) {
		this.phase = phase

		if (!this.animation) {
			this.animation = this.element.animate(this.getKeyframes(), this.timing)
			this.animation.onfinish = () => {
				if (this.phase === 'intro') {
					this.resolveIntro()
				}
				else {
					this.resolveOutro()
				}
			}
		}
		this.animation.playbackRate = this.phase === 'intro' ? 1 : -1
		this.animation.play()
	}

	getKeyframes() {
		if (this.keyframes !== null) {
			return this.keyframes
		}

		let sheets = [...(this.host.shadowRoot.adoptedStyleSheets || [])]
		![...this.host.shadowRoot.querySelectorAll('style')].forEach((style) => {
			sheets.push(style.sheet)
		})

		let keyframeRule
		sheets.find((sheet) => {
			return [...sheet.cssRules].find((rule) => {
				if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === this.animationName) {
					keyframeRule = rule
					return true
				}
			})
		})

		if (!keyframeRule) {
			this.keyframes = false
			return
		}

		this.keyframes = [...keyframeRule.cssRules].map((rule) => {
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
			Object.keys(rule.style).forEach((key) => {
				let value = rule.style[key]
				if (value && isNaN(parseInt(key))) {
					keyframe[key] = value
				}
			})
			return keyframe
		})

		return this.keyframes
	}
}