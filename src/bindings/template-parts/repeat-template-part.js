import TemplatePart from './template-part.js'
import {RepeatContainer} from './repeat-container.js'
import {Template} from '../template.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'

export default class RepeatTemplatePart extends TemplatePart {
	static relatedProps
	static parse(element, attribute) {
		if (attribute !== '#repeat') {
			return
		}

		let part = new RepeatTemplatePart(element)

		let itemsSourceExpression = parseSourceExpressionMemoized(element.getAttribute(attribute))[0]
		element.removeAttribute('#repeat')
		part.itemsSourceExpression = itemsSourceExpression

		if (element.hasAttribute('#repeat-as')) {
			part.as = element.getAttribute('#repeat-as')
			element.removeAttribute('#repeat-as')
		}

		if (element.hasAttribute('#repeat-key')) {
			part.key = element.getAttribute('#repeat-key')
			element.removeAttribute('#repeat-key')
		}

		return part
	}

	host = null
	itemTemplateRelatedProps = null

	comment = new Comment
	element = null
	itemFragment = null
	itemsSourceExpression = null

	_physicalElementsByKey = new Map
	_bindingsByElement = new Map
	key = ''
	as = 'item'

	constructor(element) {
		super()
		this.element = element
		this.element.replaceWith(this.comment)
		this.repeatContainer = new RepeatContainer(this.comment)
		this.itemFragment = document.createDocumentFragment()
		this.itemFragment.append(this.element)
		this.itemTemplateRelatedProps = new Template(this.element.cloneNode(true)).getRelatedProps()
	}

	connect(host, state) {
		this.host = host
	}

	update(state, host) {
		this._render(state)
	}

	updateProp(state, host, prop) {
		this._render(state)
	}

	getRelatedProps() {
		let props = new Set
		return new Set([...this.itemsSourceExpression.getRelatedProps(), ...this.itemTemplateRelatedProps])
	}

	async _render(state) {
		this.items = this.itemsSourceExpression.getValue(state)

		if (this.items.length) {
			this.comment.replaceWith(this.element)
		}
		else {
			this.element.replaceWith(this.comment)
		}

		await Promise.resolve()
		if (this.key) {
			this.renderSorted()
		}
		else {
			this.renderPlain()
		}
	}

	_createElement(item) {
		let fragment = this.itemFragment.cloneNode(true)
		let element = fragment.firstElementChild
		let template = new Template(fragment);
		template.connect(this.host, {[this.as]: item})
		template.update()

		if (this.key) {
			this._physicalElementsByKey.set(item[this.key], {element, template})
		}
		else {
			this._bindingsByElement.set(element, template)
		}
		return element
	}

	_removeElement(key, element) {
		if (this.key) {
			let {element, template} = this._physicalElementsByKey.get(key)
			template.disconnect()
			element.remove()
			this._physicalElementsByKey.delete(key)
		}
		else {
			let template = this._bindingsByElement.get(element)
			template.disconnect()
			element.remove()
			this._bindingsByElement.delete(element)
		}
	}

	_placeElement(element, index) {
		let child = this.repeatContainer.getChildAt(index)
		if (child) {
			child.before(element)
		}
		else {
			this.repeatContainer.append(element)
		}
	}

	// ensure element count and update templates
	renderPlain() {
		// ensure elements
		let childCount = this.repeatContainer.getChildElementCount()
		let diff = this.items.length - childCount
		if (diff > 0) {
			for (let i = 0; i < diff; i++) {
				let item = this.items[childCount + i]
				let element = this._createElement(item)
				this.repeatContainer.append(element)
			}
		}
		else if (diff < 0) {
			for (let i = 0; i > diff; i--) {
				this._removeElement(null, this.repeatContainer.getLastElementChild())
			}
		}

		// update templates
		[...this._bindingsByElement.values()].forEach((template, i) => {
			template.disconnect()
			template.connect(this.host, {[this.as]: this.items[i]})
			template.update()
		})
	}

	// sort existing elements by key
	renderSorted() {
		// remove elements
		let removedElements = []
		let currentKeys = new Set(this._physicalElementsByKey.keys())
		this.items.forEach((item) => {
			currentKeys.delete(item[this.key])
		})
		currentKeys.forEach((key) => {
			this._removeElement(key)
		})

		// add/update elements
		this.items.forEach((item, index) => {
			let physical = this._physicalElementsByKey.get(item[this.key])
			if (physical) {
				physical.template.update()
			}
			else {
				let element = this._createElement(item)
				this._placeElement(element, index)
			}
		})

		// sort elements
		let sort = () => {
			let children = this.repeatContainer.getChildren()
			let itemsInfo = this.items.map((item, newIndex) => {
				let physical = this._physicalElementsByKey.get(item[this.key])
				let oldIndex = children.indexOf(physical.element)
				return {
					item,
					oldIndex,
					newIndex,
					diffIndex: Math.abs(oldIndex - newIndex),
				}
			}).filter((itemInfo) => {
				return itemInfo.diffIndex
			}).sort((a, b) => {
				return b.diffIndex - a.diffIndex
			})
			if (!itemsInfo.length) {
				return
			}
			this._placeElement(itemsInfo[0], itemsInfo[0].newIndex)
			sort()
		}
		sort()
	}
}