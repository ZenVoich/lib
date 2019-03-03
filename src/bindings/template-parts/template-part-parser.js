import BindingsTemplatePart from './bindings-template-part.js'
import ShowHideTemplatePart from './show-hide-template-part.js'
import AttachDetachTemplatePart from './attach-detach-template-part.js'
import RepeatTemplatePart from './repeat-template-part.js'

export let parse = (root) => {
	let parts = []
	let walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
	let curNode = walker.nextNode()
	while (true) {
		if (!curNode) {
			break
		}
		// let part = parseDirectiveElement(curNode)
		// if (part) {
		if (isDirectiveElement(curNode)) {
			let tempNode = curNode
			curNode = walker.nextSibling()
			let part = parseDirectiveElement(tempNode)
			if (part) {
				parts.push(part)
				continue
			}
		}
		curNode = walker.nextNode()
	}

	parts.unshift(BindingsTemplatePart.parse(root))

	return parts
}

let isDirectiveElement = (element) => {
	return element.getAttributeNames().find((attr) => {
		return attr[0] === '#'
	})
}

let templatePartClasses = [
	ShowHideTemplatePart,
	AttachDetachTemplatePart,
	RepeatTemplatePart,
]
let parseDirectiveElement = (element) => {
	let part
	let directive
	element.getAttributeNames().find((attr) => {
		if (attr[0] !== '#') {
			return
		}
		if (!directive) {
			directive = attr
		}
		return templatePartClasses.find((templatePartClass) => {
			part = templatePartClass.parse(element, attr)
			return part
		})
	})

	let extraDirective = element.getAttributeNames().find(attr => attr[0] === '#')
	if (extraDirective) {
		if (part) {
			console.error(`Only one directive can be used in an element (extra directive '${extraDirective}')`, element)
		}
		else {
			console.error(`Unknown directive '${extraDirective}'`, element)
		}
	}

	return part
}