import {TemplatePart} from './template-part.js'
import {RepeatContainer} from './repeat-container.js'
import {RepeatObject} from './repeat-object.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {requestRender} from '../../utils/renderer.js'

export class RepeatTemplatePart extends TemplatePart {
	static parseSkeleton(template, attribute) {
		if (attribute !== '#repeat') {
			return
		}

		let itemsSourceExpression = parseSourceExpressionMemoized(template.getAttribute(attribute))
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
			relatedPaths: new Set([...itemsSourceExpression.relatedPaths].map((prop) => {
				return prop + '.length'
			}))
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
	}

	connect(host) {
		this.host = host
		this._repeatObjectsByKey.forEach((repeatObject) => {
			repeatObject.connect(host)
		})
		this._repeatObjectsByIndex.forEach((repeatObject) => {
			repeatObject.connect(host)
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

	_createRepeatObject(state, item, index, immediate) {
		let itemTemplateRoot = TemplateRoot.fromSkeleton(this.itemTemplateRootSkeleton)
		let repeatObject = new RepeatObject(itemTemplateRoot, this.as)
		repeatObject.connect(this.host, item)
		// repeatObject.updateWithState(state, immediate)
		repeatObject.update(state, immediate)

		if (this.key) {
			this._repeatObjectsByKey.set(item[this.key], repeatObject)
		}
		else {
			this._repeatObjectsByIndex.set(index, repeatObject)
		}
		return repeatObject
	}

	_removeElement(key, index) {
		if (this.key) {
			let repeatObject = this._repeatObjectsByKey.get(key)
			repeatObject.remove()

			this._repeatObjectsByKey.delete(key)
			index = this._actualOrder.indexOf(key)
			this._actualOrder.splice(index, 1)
		}
		else {
			let repeatObject = this._repeatObjectsByIndex.get(index)
			repeatObject.remove()

			this._repeatObjectsByIndex.delete(index)
		}
	}

	// ensure element count and update templates
	_renderPlain(state, immediate) {
		// update existing elements
		let preparedState = RepeatObject.prepareState(state)
		this._repeatObjectsByIndex.forEach((repeatObject, i) => {
			let item = this.items[i]
			if (repeatObject.item !== item) {
				repeatObject.disconnect()
				repeatObject.connect(this.host, item)
			}
			repeatObject.updateWithState(RepeatObject.mergeStates(preparedState, {[this.as]: this.items[i]}), immediate)
		})

		let render = () => {
			// add new elements
			let existingCount = this._repeatObjectsByIndex.size
			let diff = this.items.length - existingCount
			if (diff > 0) {
				for (let i = 0; i < diff; i++) {
					let item = this.items[existingCount + i]
					let repeatObject = this._createRepeatObject(state, item, existingCount + i, true)
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
		// let preparedState = RepeatObject.prepareState(state)
		// this.items.forEach((item, index) => {
		// 	let repeatObject = this._repeatObjectsByKey.get(item[this.key])
		// 	if (repeatObject) {
		// 		repeatObject.templateRoot.updateWithState(RepeatObject.mergeStates(preparedState, {[this.as]: item}), immediate)
		// 	}
		// })

		let render = () => {
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
					let repeatObject = this._createRepeatObject(state, item, index, true)
					this._placeElement(item, repeatObject.fragmentContainer, null, index)
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

		if (immediate) {
			render()
		}
		else {
			requestRender(this.host, this, render)
		}
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