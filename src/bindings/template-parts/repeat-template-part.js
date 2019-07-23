import {TemplatePart} from './template-part.js'
import {RepeatContainer} from './repeat-container.js'
import {RepeatObject} from './repeat-object.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {pub} from '../../utils/pub-sub.js'

export class RepeatTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (attribute !== '#repeat') {
			return
		}

		let match = template.getAttribute(attribute).match(/\s*\{\s*(.+?)(?:\s*as\s+(.+?)\s*)?(?:\s*by\s+(.+?)\s*)?\s*\}\s*/)
		let itemsSourceExpression = match && parseSourceExpressionMemoized(`{${match[1]}}`)

		if (!itemsSourceExpression) {
			throw `Invalid #repeat value: #repeat="${template.getAttribute(attribute)}"`
		}

		template.removeAttribute('#repeat')

		return {
			as: match[2] || 'item',
			key: match[3] || '',
			itemsSourceExpression,
			itemTemplateRootSkeleton: TemplateRoot.parseSkeleton(template),
			relatedPaths: new Set([...itemsSourceExpression.relatedPaths, ...[...itemsSourceExpression.relatedPaths].map((path) => {
				return path + '.length'
			})])
		}
	}

	static fromSkeleton(skeleton, template) {
		let part = new RepeatTemplatePart(template)
		part.as = skeleton.as
		part.key = skeleton.key
		part.itemsSourceExpression = skeleton.itemsSourceExpression
		part.itemTemplateRootSkeleton = skeleton.itemTemplateRootSkeleton
		part.relatedPaths = skeleton.relatedPaths
		return part
	}

	host
	dirtyCheck = false
	relatedPaths

	template
	itemTemplateRootSkeleton
	itemsSourceExpression
	repeatContainer

	key = ''
	as = 'item'
	_actualOrder = []
	_repeatObjectsByKey = new Map
	_repeatObjectsByIndex = new Map

	constructor(template) {
		super()
		this.template = template
		this.repeatContainer = new RepeatContainer(this.template)
		this.template.remove()

		requestAnimationFrame(() => {
			this.firstRendered = true
		})
	}

	connect(host, {dirtyCheck = false} = {}) {
		this.host = host
		this.dirtyCheck = dirtyCheck
		this._repeatObjectsByKey.forEach((repeatObject) => {
			repeatObject.connect(host, repeatObject.item, {dirtyCheck: this.dirtyCheck})
		})
		this._repeatObjectsByIndex.forEach((repeatObject) => {
			repeatObject.connect(host, repeatObject.item, {dirtyCheck: this.dirtyCheck})
		})
	}

	disconnect() {
		this.host = null
		this._repeatObjectsByKey.forEach((repeatObject, key) => {
			repeatObject.disconnect()
		})
		this._repeatObjectsByIndex.forEach((repeatObject, index) => {
			repeatObject.disconnect()
		})
		// todo: clear physical elements?
	}

	render(state) {
		this.items = this.itemsSourceExpression.getValue(state) || []

		if (this.key) {
			this._renderSorted(state)
		}
		else {
			this._renderPlain(state)
		}
	}

	_createRepeatObject(state, item, index) {
		let itemTemplateRoot = TemplateRoot.fromSkeleton(this.itemTemplateRootSkeleton)
		itemTemplateRoot.contextStates = [...this.parentTemplateRoot.contextStates, {[this.as]: item}]

		let repeatObject = new RepeatObject(itemTemplateRoot, this.as)
		repeatObject.connect(this.host, item, {dirtyCheck: this.dirtyCheck})
		repeatObject.update()
		repeatObject.render()

		if (this.key) {
			this._repeatObjectsByKey.set(item[this.key], repeatObject)
		}
		else {
			this._repeatObjectsByIndex.set(index, repeatObject)
		}
		return repeatObject
	}

	async _removeElement(key, index) {
		if (this.key) {
			let repeatObject = this._repeatObjectsByKey.get(key)

			this._repeatObjectsByKey.delete(key)
			index = this._actualOrder.indexOf(key)
			this._actualOrder.splice(index, 1)

			if (this.firstRendered) {
				await pub(this.template, 'outro', repeatObject.fragmentContainer)
			}
			repeatObject.remove()
		}
		else {
			let repeatObject = this._repeatObjectsByIndex.get(index)
			this._repeatObjectsByIndex.delete(index)

			if (this.firstRendered) {
				await pub(this.template, 'outro', repeatObject.fragmentContainer)
			}
			repeatObject.remove()
		}
	}

	// ensure element count and update templates
	_renderPlain(state) {
		// update existing elements
		this._repeatObjectsByIndex.forEach((repeatObject, i) => {
			let item = this.items[i]
			if (repeatObject.item !== item) {
				repeatObject.disconnect()
				repeatObject.templateRoot.contextStates = [...this.parentTemplateRoot.contextStates, {[this.as]: item}]
				repeatObject.connect(this.host, item, {dirtyCheck: this.dirtyCheck})
			}
			repeatObject.update()
			repeatObject.render()
		})

		// add new elements
		let existingCount = this._repeatObjectsByIndex.size
		let diff = this.items.length - existingCount
		if (diff > 0) {
			for (let i = 0; i < diff; i++) {
				let item = this.items[existingCount + i]
				let repeatObject = this._createRepeatObject(state, item, existingCount + i)
				this.repeatContainer.append(repeatObject.fragmentContainer.content)
			}
		}
		// remove extra elements
		else if (diff < 0) {
			for (let i = 0; i > diff; i--) {
				this._removeElement(null, existingCount - 1 + i)
			}
		}
	}

	// sort existing elements by key
	_renderSorted(state) {
		// update elements
		if (this.dirtyCheck) {
			this.items.forEach((item, index) => {
				let repeatObject = this._repeatObjectsByKey.get(item[this.key])
				if (repeatObject) {
					repeatObject.update()
					repeatObject.render()
				}
			})
		}

		// remove elements
		let currentKeys = new Set(this._repeatObjectsByKey.keys())
		this.items.forEach((item) => {
			currentKeys.delete(item[this.key])
		})
		currentKeys.forEach((key) => {
			this._removeElement(key)
		})

		// add elements
		this.items.forEach((item, index) => {
			let hasPhysical = this._repeatObjectsByKey.has(item[this.key])
			if (!hasPhysical) {
				let repeatObject = this._createRepeatObject(state, item, index)
				this._placeElement(item, repeatObject.fragmentContainer, null, index)

				if (this.firstRendered) {
					pub(this.template, 'intro', repeatObject.fragmentContainer)
				}
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
				let repeatObject = this._repeatObjectsByKey.get(item[this.key])
				let oldIndex = this._actualOrder.indexOf(item[this.key])
				return {
					item,
					repeatObject,
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
			this._placeElement(itemInfo.item, itemInfo.repeatObject.fragmentContainer, itemInfo.oldIndex, itemInfo.newIndex)

			sort()
		}
		sort()
	}

	_placeElement(item, fragmentContainer, oldIndex, newIndex) {
		let currentItemKey = this._actualOrder[newIndex]
		let currentRepeatObject = currentItemKey && this._repeatObjectsByKey.get(currentItemKey)

		if (oldIndex !== null) {
			fragmentContainer.remove()
			this._actualOrder.splice(oldIndex, 1)
		}

		if (currentRepeatObject) {
			currentRepeatObject.fragmentContainer.before(fragmentContainer.content)
			this._actualOrder.splice(newIndex, 0, item[this.key])
		}
		else {
			this.repeatContainer.append(fragmentContainer.content)
			this._actualOrder.push(item[this.key])
		}
	}
}