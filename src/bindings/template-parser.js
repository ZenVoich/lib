import BindingsTemplatePart from './template-parts/bindings-template-part.js'
import ShowHideTemplatePart from './template-parts/show-hide-template-part.js'
import AttachDetachTemplatePart from './template-parts/attach-detach-template-part.js'
import RepeatTemplatePart from './template-parts/repeat-template-part.js'

export let parse = (template) => {
	let parts = []
	let walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT)
	let curNode = walker.nextNode()

	while (true) {
		if (!curNode) {
			break
		}
		// let part = parseDirectiveElement(curNode)
		// if (part) {
		if (isDirectiveElement(curNode)) {
			let tempNode = curNode
			curNode = walker.nextSibling() || walker.nextNode()
			let part = parseDirectiveElement(ensureDirectiveTemplate(tempNode))
			if (part) {
				parts.push(part)
				continue
			}
		}
		curNode = walker.nextNode()
	}

	parts.unshift(BindingsTemplatePart.parse(template.content))

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