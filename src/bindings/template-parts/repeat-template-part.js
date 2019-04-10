import TemplatePart from './template-part.js'
import {RepeatContainer} from './repeat-container.js'
import {FragmentContainer} from './fragment-container.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'
import perf from '../../utils/perf.js'

export default class RepeatTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (attribute !== '#repeat') {
			return
		}

		let itemsSourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))[0]
		template.removeAttribute('#repeat')

		let as = 'item'
		if (template.hasAttribute('#repeat-as')) {
			as = template.getAttribute('#repeat-as')
			template.removeAttribute('#repeat-as')
		}

		let key = ''
		if (template.hasAttribute('#repeat-key')) {
			key = template.getAttribute('#repeat-key')
			template.removeAttribute('#repeat-key')
		}

		let itemTemplateRootSkeleton = TemplateRoot.parseSkeleton(template)

		return {
			as,
			key,
			itemsSourceExpression,
			itemTemplateRootSkeleton,
			relatedProps: new Set([
				...itemsSourceExpression.getRelatedProps(),
				...TemplateRoot.fromSkeleton(itemTemplateRootSkeleton).getRelatedProps()
			]),
		}
	}

	static fromSkeleton(skeleton, template) {
		let part = new RepeatTemplatePart(template)
		part.as = skeleton.as
		part.key = skeleton.key
		part.itemsSourceExpression = skeleton.itemsSourceExpression
		part.itemTemplateRootSkeleton = skeleton.itemTemplateRootSkeleton
		part.relatedProps = skeleton.relatedProps
		return part
	}

	host = null

	template = null
	itemTemplateRootSkeleton = null
	itemsSourceExpression = null
	relatedProps = null
	repeatContainer = null

	key = ''
	as = 'item'
	_actualOrder = []
	_physicalElementsByKey = new Map
	_physicalElementsByIndex = new Map

	constructor(template) {
		super()
		this.template = template
		this.repeatContainer = new RepeatContainer(this.template)
		this.template.remove()
	}

	connect(host) {
		this.host = host
		this._physicalElementsByKey.forEach(({templateRoot}) => {
			templateRoot.connect(host)
		})
		this._physicalElementsByIndex.forEach(({templateRoot}) => {
			templateRoot.connect(host)
		})
	}

	disconnect() {
		this.host = null
		this._physicalElementsByKey.forEach(({templateRoot}) => {
			templateRoot.disconnect()
		})
		this._physicalElementsByIndex.forEach(({templateRoot}) => {
			templateRoot.disconnect()
		})
	}

	update(state, immediate) {
		this._render(state, immediate)
	}

	updateProp(state, prop, immediate) {
		this._render(state, immediate)
	}

	_render(state, immediate) {
		this.items = this.itemsSourceExpression.getValue(state) || []

		if (this.key) {
			this._renderSorted(state, immediate)
		}
		else {
			this._renderPlain(state, immediate)
		}
	}

	getRelatedProps() {
		return this.relatedProps
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

	_createFragmentContainer(state, item, index, immediate) {
		let itemTemplateRoot = TemplateRoot.fromSkeleton(this.itemTemplateRootSkeleton)
		let fragmentContainer = new FragmentContainer(itemTemplateRoot.content)

		itemTemplateRoot.connect(this.host)
		let preparedState = this._prepareState(state)
		itemTemplateRoot.update(this._mergeStates(preparedState, {[this.as]: item}), immediate)

		if (this.key) {
			this._physicalElementsByKey.set(item[this.key], {fragmentContainer, templateRoot: itemTemplateRoot, index})
		}
		else {
			this._physicalElementsByIndex.set(index, {fragmentContainer, templateRoot: itemTemplateRoot})
		}
		return fragmentContainer
	}

	_removeElement(key, index) {
		if (this.key) {
			let {fragmentContainer, templateRoot} = this._physicalElementsByKey.get(key)
			templateRoot.disconnect()
			fragmentContainer.remove()
			this._physicalElementsByKey.delete(key)

			index = this._actualOrder.indexOf(key)
			this._actualOrder.splice(index, 1)
		}
		else {
			let {fragmentContainer, templateRoot} = this._physicalElementsByIndex.get(index)
			templateRoot.disconnect()
			fragmentContainer.remove()
			this._physicalElementsByIndex.delete(index)
		}
	}

	// ensure element count and update templates
	_renderPlain(state, immediate) {
		// update existing elements
		let preparedState = this._prepareState(state)
		this._physicalElementsByIndex.forEach(({templateRoot}, i) => {
			templateRoot.update(this._mergeStates(preparedState, {[this.as]: this.items[i]}), immediate)
		})

		let render = () => {
			// add new elements
			let existingCount = this._physicalElementsByIndex.size
			let diff = this.items.length - existingCount
			if (diff > 0) {
				for (let i = 0; i < diff; i++) {
					let item = this.items[existingCount + i]
					let fragmentContainer = this._createFragmentContainer(state, item, existingCount + i, true)
					this.repeatContainer.append(fragmentContainer.content)
				}
			}
			// remove extra elements
			else if (diff < 0) {
				for (let i = 0; i > diff; i--) {
					this._removeElement(null, existingCount - 1 + i)
				}
			}
		}

		if (immediate) {
			render()
		}
		else {
			requestRender(this.host, this, render)
		}
	}

	// sort existing elements by key
	_renderSorted(state, immediate) {
		// update elements
		let preparedState = this._prepareState(state)
		this.items.forEach((item, index) => {
			let physical = this._physicalElementsByKey.get(item[this.key])
			if (physical) {
				physical.templateRoot.update(this._mergeStates(preparedState, {[this.as]: item}), immediate)
			}
		})

		let render = () => {
			// remove elements
			let currentKeys = new Set(this._physicalElementsByKey.keys())
			this.items.forEach((item) => {
				currentKeys.delete(item[this.key])
			})
			currentKeys.forEach((key) => {
				this._removeElement(key)
			})

			// add elements
			this.items.forEach((item, index) => {
				let hasPhysical = this._physicalElementsByKey.has(item[this.key])
				if (!hasPhysical) {
					let fragmentContainer = this._createFragmentContainer(state, item, index, true)
					this._actualOrder.push(item[this.key])
					this.repeatContainer.append(fragmentContainer.content)
				}
			})

			// sort elements
			let x = 0
			let sort = () => {
				x++
				if (x > 10) {
					console.log('loop')
					return
				}

				let itemsInfo = this.items.map((item, newIndex) => {
					let physical = this._physicalElementsByKey.get(item[this.key])
					let oldIndex = this._actualOrder.indexOf(item[this.key])
					return {
						item,
						physical,
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

				let itemInfo = itemsInfo[0]
				this._placeElement(itemInfo.item, itemInfo.physical, itemInfo.oldIndex, itemInfo.newIndex)
				itemInfo.physical.index = itemInfo.newIndex

				// update indices
				this.items.slice().forEach((item, i) => {
					let physical = this._physicalElementsByKey.get(item[this.key])
					let correctActual = this._actualOrder[i] === item[this.key]
					if (physical && correctActual) {
						physical.index = i
					}
				})

				sort()
			}
			sort()
		}

		if (immediate) {
			render()
		}
		else {
			requestRender(this.host, this, render)
		}
	}

	_placeElement(item, physical, oldIndex, newIndex) {
		let currentItemKey = this._actualOrder[newIndex]
		let current = currentItemKey && this._physicalElementsByKey.get(currentItemKey)

		physical.fragmentContainer.remove()
		this._actualOrder.splice(oldIndex, 1)

		if (current) {
			current.fragmentContainer.before(physical.fragmentContainer.content)
			this._actualOrder.splice(newIndex, 0, item[this.key])
		}
	}
}