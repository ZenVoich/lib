import {TemplatePart} from './template-part.js'
import {RepeatContainer} from './repeat-container.js'
import {RepeatObject} from './repeat-object.js'
import {TemplateRoot} from '../template-root.js'
import {parseSourceExpressionMemoized} from '../bindings-parser.js'
import {pub} from '../../utils/pub-sub.js'

export class RepeatTemplatePart extends TemplatePart {
	static exclusive = true
	static attributes = ['#repeat']
	static parseSkeleton(template, attrName, attrValue) {
		let match = attrValue.match(/\s*\{\s*(.+?)(?:\s*as\s+(.+?)(?:\s*,\s*(.+?))?\s*)?(?:\s*by\s+(.+?)\s*)?\s*\}\s*/)
		let itemsSourceExpression = match && parseSourceExpressionMemoized(`{${match[1]}}`)

		if (!itemsSourceExpression) {
			setTimeout(() => {
				throw `Invalid value: #repeat="${attrValue}"`
			})
			return
		}

		return {
			as: match[2] || 'item',
			indexAs: match[3],
			key: match[4] || '',
			itemsSourceExpression,
			itemTemplateRootSkeleton: TemplateRoot.parseSkeleton(template),
			relatedPaths: new Set([...itemsSourceExpression.relatedPaths, ...[...itemsSourceExpression.relatedPaths].map((path) => {
				return path + '.length'
			})])
		}
	}

	relatedPaths

	#host
	#dirtyCheck = false

	#template
	#itemTemplateRootSkeleton
	#itemsSourceExpression
	#repeatContainer

	#key = ''
	#as = 'item'
	#indexAs = ''
	#actualOrder = []
	#repeatObjectsByKey = new Map
	#repeatObjectsByIndex = new Map

	constructor({as, indexAs, key, itemsSourceExpression, itemTemplateRootSkeleton, relatedPaths}, template) {
		super()

		this.#template = template
		this.#as = as
		this.#indexAs = indexAs
		this.#key = key
		this.#itemsSourceExpression = itemsSourceExpression
		this.#itemTemplateRootSkeleton = itemTemplateRootSkeleton
		this.relatedPaths = relatedPaths

		this.#repeatContainer = new RepeatContainer(this.#template)
		this.#template.remove()

		requestAnimationFrame(() => {
			this.firstRendered = true
		})
	}

	connect(host, {dirtyCheck = false} = {}) {
		this.#host = host
		this.#dirtyCheck = dirtyCheck
		this.#repeatObjectsByKey.forEach((repeatObject) => {
			repeatObject.connect(host, repeatObject.item, {dirtyCheck: this.#dirtyCheck})
		})
		this.#repeatObjectsByIndex.forEach((repeatObject) => {
			repeatObject.connect(host, repeatObject.item, {dirtyCheck: this.#dirtyCheck})
		})
	}

	disconnect() {
		this.#host = null
		this.#repeatObjectsByKey.forEach((repeatObject, key) => {
			repeatObject.disconnect()
		})
		this.#repeatObjectsByIndex.forEach((repeatObject, index) => {
			repeatObject.disconnect()
		})
		// todo: clear physical elements?
	}

	render(states) {
		this.items = this.#itemsSourceExpression.getValue(states) || []

		if (this.#key) {
			this._renderSorted(states)
		}
		else {
			this._renderPlain(states)
		}
	}

	_makeContextState(item, index) {
		let contextState = {[this.#as]: item}
		if (this.#indexAs) {
			contextState[this.#indexAs] = index
		}
		return contextState
	}

	_createRepeatObject(state, item, index) {
		let itemTemplateRoot = new TemplateRoot(this.#itemTemplateRootSkeleton)
		let contextState = this._makeContextState(item, index)

		itemTemplateRoot.contextStates = [...this.parentTemplateRoot.contextStates, contextState]

		let repeatObject = new RepeatObject(itemTemplateRoot, contextState)
		repeatObject.connect(this.#host, item, {dirtyCheck: this.#dirtyCheck})
		repeatObject.update()
		repeatObject.render()

		if (this.#key) {
			this.#repeatObjectsByKey.set(item[this.#key], repeatObject)
		}
		else {
			this.#repeatObjectsByIndex.set(index, repeatObject)
		}
		return repeatObject
	}

	async _removeElement(key, index) {
		if (this.#key) {
			let repeatObject = this.#repeatObjectsByKey.get(key)

			this.#repeatObjectsByKey.delete(key)
			index = this.#actualOrder.indexOf(key)
			this.#actualOrder.splice(index, 1)

			if (this.firstRendered) {
				await pub(repeatObject.templateRoot, 'outro', repeatObject.fragmentContainer)
			}
			repeatObject.remove()
		}
		else {
			let repeatObject = this.#repeatObjectsByIndex.get(index)
			this.#repeatObjectsByIndex.delete(index)

			// if (this.firstRendered) {
			// 	await pub(repeatObject.templateRoot, 'outro', repeatObject.fragmentContainer)
			// }
			repeatObject.remove()
		}
	}

	// ensure element count and update templates
	_renderPlain(states) {
		// add new elements
		let existingCount = this.#repeatObjectsByIndex.size
		let diff = this.items.length - existingCount
		if (diff > 0) {
			for (let i = 0; i < diff; i++) {
				let item = this.items[existingCount + i]
				let repeatObject = this._createRepeatObject(states, item, existingCount + i)
				this.#repeatContainer.append(repeatObject.fragmentContainer.content)
			}
		}
		// remove extra elements
		else if (diff < 0) {
			for (let i = 0; i > diff; i--) {
				this._removeElement(null, existingCount - 1 + i)
			}
		}
		// update existing elements
		this.#repeatObjectsByIndex.forEach((repeatObject, i) => {
			let item = this.items[i]
			if (repeatObject.item !== item) {
				repeatObject.disconnect()
				repeatObject.templateRoot.contextStates = [...this.parentTemplateRoot.contextStates, this._makeContextState(item, i)]
				repeatObject.connect(this.#host, item, {dirtyCheck: this.#dirtyCheck})

				// if (this.firstRendered) {
				// 	pub(repeatObject.templateRoot, 'intro', repeatObject.fragmentContainer)
				// }
				repeatObject.update()
				repeatObject.render()
			}
		})
	}

	// sort existing elements by key
	_renderSorted(states) {
		// update elements
		if (this.#dirtyCheck) {
			this.items.forEach((item, index) => {
				let repeatObject = this.#repeatObjectsByKey.get(item[this.#key])
				if (repeatObject) {
					repeatObject.update()
					repeatObject.render()
				}
			})
		}

		// remove elements
		let currentKeys = new Set(this.#repeatObjectsByKey.keys())
		this.items.forEach((item) => {
			currentKeys.delete(item[this.#key])
		})
		currentKeys.forEach((key) => {
			this._removeElement(key)
		})

		this.items.forEach((item, index) => {
			let repeatObject = this.#repeatObjectsByKey.get(item[this.#key])
			// add element
			if (!repeatObject) {
				repeatObject = this._createRepeatObject(states, item, index)
				this._placeElement(item, repeatObject.fragmentContainer, null, index)

				if (this.firstRendered) {
					pub(repeatObject.templateRoot, 'intro', repeatObject.fragmentContainer)
				}
			}
			// update index
			else if (this.#indexAs && repeatObject.contextState[this.#indexAs] !== index) {
				repeatObject.contextState[this.#indexAs] = index
			}
		})

		// sort elements
		let sort = () => {
			let itemsInfo = this.items.map((item, newIndex) => {
				let repeatObject = this.#repeatObjectsByKey.get(item[this.#key])
				let oldIndex = this.#actualOrder.indexOf(item[this.#key])
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
		let currentItemKey = this.#actualOrder[newIndex]
		let currentRepeatObject = currentItemKey && this.#repeatObjectsByKey.get(currentItemKey)

		if (oldIndex !== null) {
			fragmentContainer.remove()
			this.#actualOrder.splice(oldIndex, 1)
		}

		if (currentRepeatObject) {
			currentRepeatObject.fragmentContainer.before(fragmentContainer.content)
			this.#actualOrder.splice(newIndex, 0, item[this.#key])
		}
		else {
			this.#repeatContainer.append(fragmentContainer.content)
			this.#actualOrder.push(item[this.#key])
		}
	}
}