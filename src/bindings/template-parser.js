import {BindingsTemplatePart} from './template-parts/bindings-template-part.js'
import {ShowHideTemplatePart} from './template-parts/show-hide-template-part.js'
import {AttachDetachTemplatePart} from './template-parts/attach-detach-template-part.js'
import {RepeatTemplatePart} from './template-parts/repeat-template-part.js'
import {TransitionTemplatePart} from './template-parts/transition-template-part.js'
import {AnimationJsTemplatePart} from './template-parts/animation-js-template-part.js'
import {AnimationCssTemplatePart} from './template-parts/animation-css-template-part.js'
import {perf} from '../utils/perf.js'

export let parseSkeleton = (template) => {
	perf.markStart('template.parseSkeleton')
	let partSkeletons = new Map
	let walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT)
	let curNode = walker.nextNode()
	let elementIndex = -1

	while (true) {
		if (!curNode) {
			break
		}
		elementIndex++

		if (isDirectiveElement(curNode)) {
			let tempNode = curNode
			curNode = walker.nextSibling() || walker.nextNode()
			let skeletons = parseDirectiveElement(ensureDirectiveTemplate(tempNode))
			if (skeletons.length) {
				partSkeletons.set(elementIndex, skeletons)
			}
			continue
		}
		curNode = walker.nextNode()
	}

	let skeletons = parseDirectiveElement(ensureDirectiveTemplate(template))
	if (skeletons.length) {
		partSkeletons.set('root', skeletons)
	}

	partSkeletons.set('bindings', [{
		partClass: BindingsTemplatePart,
		partSkeleton: BindingsTemplatePart.parseSkeleton(template.content),
	}])
	perf.markEnd('template.parseSkeleton')

	return partSkeletons
}

export let fromSkeleton = (partsSkeletons, template) => {
	// perf.markStart('template.fromSkeleton')
	let parts = []
	let walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT)
	let curNode = walker.nextNode()
	let elementIndex = -1

	let [bindingsSkeletonInfo] = partsSkeletons.get('bindings')
	let part = new bindingsSkeletonInfo.partClass(bindingsSkeletonInfo.partSkeleton, template.content)
	parts.push(part)

	let rootSkeletonsInfo = partsSkeletons.get('root')
	if (rootSkeletonsInfo) {
		rootSkeletonsInfo.forEach((skeletonInfo) => {
			let part = new skeletonInfo.partClass(skeletonInfo.partSkeleton, template)
			parts.push(part)
		})
	}

	while (true) {
		if (!curNode) {
			break
		}
		elementIndex++
		let skeletons = partsSkeletons.get(elementIndex)
		if (skeletons && skeletons.length) {
			let tempNode = curNode
			curNode = walker.nextNode()
			skeletons.forEach((skeletonInfo) => {
				let part = new skeletonInfo.partClass(skeletonInfo.partSkeleton, tempNode)
				parts.push(part)
			})
		}
		else {
			curNode = walker.nextNode()
		}
	}
	// perf.markEnd('template.fromSkeleton')

	return parts
}

let isDirectiveElement = (element) => {
	return element.getAttributeNames().find((attr) => {
		return attr[0] === '#'
	})
}

let ensureDirectiveTemplate = (element) => {
	if (element.localName === 'template') {
		return element
	}

	// wrap directive element with a <template>
	let template = document.createElement('template')
	element.replaceWith(template)
	template.content.append(element)

	// move directive attributes to <template> tag
	element.getAttributeNames().forEach((attr) => {
		if (attr.startsWith('#')) {
			template.attributes.setNamedItem(element.attributes[attr].cloneNode())
			element.removeAttribute(attr)
		}
	})

	return template
}

let templatePartClasses = [
	ShowHideTemplatePart,
	AttachDetachTemplatePart,
	RepeatTemplatePart,
	TransitionTemplatePart,
	AnimationJsTemplatePart,
	AnimationCssTemplatePart,
]
let parseDirectiveElement = (element) => {
	let skeletons = []

	let attrs = element.getAttributeNames()

	let directiveWhitelist = [
		'#show',
		'#hide',
		'#attach',
		'#detach',
		'#repeat',
		'#transition',
		'#animation',
		'#animation-in',
		'#animation-out',
	]
	let unknownDirective = attrs.find(attr => attr.startsWith('#') && !directiveWhitelist.includes(attr))
	if (unknownDirective) {
		console.error(`Unknown directive '${unknownDirective}'`, element)
		return
	}

	let directives = attrs.filter(attr => attr.startsWith('#') && !attr.startsWith('#transition') && !attr.startsWith('#animation'))
	if (directives.length > 1) {
		console.error(`Directives ${directives[0]} and ${directives[1]} can't be used together`, element)
		return
	}

	attrs.find((attr) => {
		if (attr[0] !== '#') {
			return
		}
		return templatePartClasses.find((templatePartClass) => {
			let val = element.getAttribute(attr)
			let partSkeleton = templatePartClass.parseSkeleton(element, attr)

			if (partSkeleton) {
				skeletons.push({
					partClass: templatePartClass,
					partSkeleton: partSkeleton,
				})

				if (attr === '#repeat') {
					return true
				}
				// return true
			}
		})
	})

	return skeletons
}