import BindingsTemplatePart from './bindings-template-part.js'
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
			// part.init()
			parts.push(part)
			continue
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
	if (!part && directive) {
		throw `Unknown directive '${directive}'`
	}
	return part
}