import TemplatePart from './template-part.js'
import {RepeatContainer} from './repeat-container.js'
import {Template} from '../template.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'
import perf from '../../utils/perf.js'

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
		this.repeatContainer = new RepeatContainer(this.element)

		this.itemFragment = document.createDocumentFragment()
		this.itemFragment.append(this.element)

		this.itemTemplateRelatedProps = new Template(this.element.cloneNode(true)).getRelatedProps()
	}

	connect(host) {
		this.host = host
		this._physicalElementsByKey.forEach(({template}) => {
			template.connect(host)
		})
		this._bindingsByElement.forEach((template) => {
			template.connect(host)
		})
	}

	disconnect() {
		this.host = null
		this._physicalElementsByKey.forEach(({template}) => {
			template.disconnect()
		})
		this._bindingsByElement.forEach((template) => {
			template.disconnect()
		})
	}

	update(state) {
		this._render(state)
	}

	updateProp(state, prop) {
		this._render(state)
	}

	getRelatedProps() {
		let props = new Set
		return new Set([...this.itemsSourceExpression.getRelatedProps(), ...this.itemTemplateRelatedProps])
	}

	_prepareState(host) {
		let hostState = {}
		Object.getOwnPropertyNames(host).forEach((prop) => {
			hostState[prop] = host[prop]
		})
		hostState.localName = host.localName
		return hostState
	}

	_mergeStates(hostState, state) {
		perf.markStart('repeat-template-part: merge states')

		state = Object.assign({}, hostState, state)
		perf.markEnd('repeat-template-part: merge states')
		return state
	}

	async _render(state) {
		this.items = this.itemsSourceExpression.getValue(state) || []

		if (this.key) {
			this._renderSorted(state)
		}
		else {
			this._renderPlain(state)
		}
	}

	_createElement(state, item) {
		let fragment = this.itemFragment.cloneNode(true)
		let element = fragment.firstElementChild
		let template = new Template(fragment)
		template.connect(this.host)
		let preparedState = this._prepareState(state)
		template.update(this._mergeStates(preparedState, {[this.as]: item}))

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
	_renderPlain(state) {
		// ensure elements
		let childCount = this.repeatContainer.getChildElementCount()
		let diff = this.items.length - childCount
		if (diff > 0) {
			for (let i = 0; i < diff; i++) {
				let item = this.items[childCount + i]
				let element = this._createElement(state, item)
				this.repeatContainer.append(element)
			}
		}
		else if (diff < 0) {
			for (let i = 0; i > diff; i--) {
				this._removeElement(null, this.repeatContainer.getLastElementChild())
			}
		}

		// update templates
		let preparedState = this._prepareState(state)
		![...this._bindingsByElement.values()].forEach((template, i) => {
			template.update(this._mergeStates(preparedState, {[this.as]: this.items[i]}))
		})
	}

	// sort existing elements by key
	_renderSorted(state) {
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
		let preparedState = this._prepareState(state)
		this.items.forEach((item, index) => {
			let physical = this._physicalElementsByKey.get(item[this.key])
			if (physical) {
				physical.template.update(this._mergeStates(preparedState, {[this.as]: item}))
			}
			else {
				let element = this._createElement(state, item)
				this._placeElement(element, index)
			}
		})

		// sort elements
		let x = 0
		let sort = () => {
			x++
			if (x > 10) {
				return
			}
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