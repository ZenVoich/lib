import TemplatePart from './template-part.js'
import {RepeatContainer} from './repeat-container.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'
import perf from '../../utils/perf.js'

export default class RepeatTemplatePart extends TemplatePart {
	static relatedProps
	static parse(template, attribute) {
		if (attribute !== '#repeat') {
			return
		}

		let part = new RepeatTemplatePart(template)

		let itemsSourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))[0]
		template.removeAttribute('#repeat')
		part.itemsSourceExpression = itemsSourceExpression

		if (template.hasAttribute('#repeat-as')) {
			part.as = template.getAttribute('#repeat-as')
			template.removeAttribute('#repeat-as')
		}

		if (template.hasAttribute('#repeat-key')) {
			part.key = template.getAttribute('#repeat-key')
			template.removeAttribute('#repeat-key')
		}

		return part
	}

	host = null
	itemTemplateRelatedProps = null

	template = null
	itemTemplateRoot = null
	itemsSourceExpression = null

	_physicalElementsByKey = new Map
	_bindingsByElement = new Map
	key = ''
	as = 'item'

	constructor(template) {
		super()
		this.template = template
		this.repeatContainer = new RepeatContainer(this.template)
		this.itemTemplateRoot = new TemplateRoot(this.template)
		this.itemTemplateRelatedProps = this.itemTemplateRoot.getRelatedProps()
		this.template.remove()
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

	_render(state) {
		this.items = this.itemsSourceExpression.getValue(state) || []

		if (this.key) {
			this._renderSorted(state)
		}
		else {
			this._renderPlain(state)
		}
	}

	_createElement(state, item) {
		let itemTemplateRoot = this.itemTemplateRoot.clone()
		let element = itemTemplateRoot.content.firstElementChild

		itemTemplateRoot.connect(this.host)
		let preparedState = this._prepareState(state)
		itemTemplateRoot.update(this._mergeStates(preparedState, {[this.as]: item}))

		if (this.key) {
			this._physicalElementsByKey.set(item[this.key], {element, templateRoot: itemTemplateRoot})
		}
		else {
			this._bindingsByElement.set(element, itemTemplateRoot)
		}
		return element
	}

	_removeElement(key, element) {
		if (this.key) {
			let {element, templateRoot} = this._physicalElementsByKey.get(key)
			templateRoot.disconnect()
			element.remove()
			this._physicalElementsByKey.delete(key)
		}
		else {
			let templateRoot = this._bindingsByElement.get(element)
			templateRoot.disconnect()
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
		![...this._bindingsByElement.values()].forEach((templateRoot, i) => {
			templateRoot.update(this._mergeStates(preparedState, {[this.as]: this.items[i]}))
		})
	}

	// sort existing elements by key
	_renderSorted(state) {
		// remove elements
		let currentKeys = new Set(this._physicalElementsByKey.keys())
		this.items.forEach((item) => {
			currentKeys.delete(item[this.key])
		})
		currentKeys.forEach((key) => {
			this._removeElement(key)
		})

		let elementsToRender = []

		// add/update elements
		let preparedState = this._prepareState(state)
		this.items.forEach((item, index) => {
			let physical = this._physicalElementsByKey.get(item[this.key])
			if (physical) {
				physical.templateRoot.update(this._mergeStates(preparedState, {[this.as]: item}))
			}
			else {
				elementsToRender.push({state, item, index})
				// let element = this._createElement(state, item)
				// this._placeElement(element, index)
			}
		})

		requestRender(this.host, this, () => {
			elementsToRender.forEach(({state, item, index}) => {
				let element = this._createElement(state, item)
				this._placeElement(element, index)
			})

			// sort elements
			let x = 0
			let sort = () => {
				x++
				if (x > 10) {
					console.log('loop')
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
				this._placeElement(null, itemsInfo[0].newIndex)
				sort()
			}
			sort()
		})
	}
}