import BindingsTemplatePart from './template-parts/bindings-template-part.js'
import ShowHideTemplatePart from './template-parts/show-hide-template-part.js'
import AttachDetachTemplatePart from './template-parts/attach-detach-template-part.js'
import RepeatTemplatePart from './template-parts/repeat-template-part.js'
import perf from '../utils/perf.js'

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
			let skeleton = parseDirectiveElement(ensureDirectiveTemplate(tempNode))
			if (skeleton) {
				partSkeletons.set(elementIndex, skeleton)
			}
			continue
		}
		curNode = walker.nextNode()
	}

	partSkeletons.set(-1, {
		partClass: BindingsTemplatePart,
		partSkeleton: BindingsTemplatePart.parseSkeleton(template.content),
	})
	perf.markEnd('template.parseSkeleton')

	return partSkeletons
}

export let fromSkeleton = (partsSkeletons, template) => {
	// perf.markStart('template.fromSkeleton')
	let parts = []
	let walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT)
	let curNode = walker.nextNode()
	let elementIndex = -1

	let bindingsSkeletonInfo = partsSkeletons.get(-1)
	let part = bindingsSkeletonInfo.partClass.fromSkeleton(bindingsSkeletonInfo.partSkeleton, template.content)
	parts.push(part)

	while (true) {
		if (!curNode) {
			break
		}
		elementIndex++
		let skeletonInfo = partsSkeletons.get(elementIndex)
		if (skeletonInfo) {
			let tempNode = curNode
			curNode = walker.nextNode()
			let part = skeletonInfo.partClass.fromSkeleton(skeletonInfo.partSkeleton, tempNode)
			parts.push(part)
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
	if (element.matches('template')) {
		return element
	}

	// wrap directive element with a <template>
	let template = document.createElement('template')
	element.replaceWith(template)
	template.content.append(element)

	// move directive attributes to <template> tag
	element.getAttributeNames().forEach((attr) => {
		if (attr.startsWith('#')) {
			// template.setAttribute(attr.slice(1), element.getAttribute(attr))
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
]
let parseDirectiveElement = (element) => {
	let partSkeleton
	let partClass
	let directive
	element.getAttributeNames().find((attr) => {
		if (attr[0] !== '#') {
			return
		}
		if (!directive) {
			directive = attr
		}
		return templatePartClasses.find((templatePartClass) => {
			partSkeleton = templatePartClass.parseSkeleton(element, attr)
			partClass = templatePartClass
			// if (partSkeleton === false) {
			// 	return true
			// }
			return partSkeleton
		})
	})

	if (partSkeleton === false) {
		return
	}

	let extraDirective = element.getAttributeNames().find(attr => attr[0] === '#')
	if (extraDirective) {
		if (partSkeleton) {
			console.error(`Only one directive can be used in an element (extra directive '${extraDirective}')`, element)
		}
		else {
			console.error(`Unknown directive '${extraDirective}'`, element)
		}
		return
	}

	return {partClass, partSkeleton}
}