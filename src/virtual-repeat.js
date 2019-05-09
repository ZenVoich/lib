import {watch} from './decorators/method/watch.js'
import {define} from './decorators/class/define.js'
import {Bindings} from './bindings/bindings.js'

@define('virtual-repeat')
class VirtualRepeat extends HTMLElement {
	static template = `
		<style>
			:host {
				display: contents;
			}
			#container {
				max-height: 500px;
				overflow: auto;
			}
		</style>
		<div id="container">
			<slot></slot>
		</div>
	`

	items = null
	as = 'item'
	key

	_avgItemHeight = 100
	_prerenderHeight = 300
	_physicalElementsByKey = new Map
	_bindingsByElement = new Map

	@watch('items', 'as', 'key?')
	async render() {
		if (!this.template) {
			return
		}
		await Promise.resolve()
		if (this.key) {
			this.renderSorted()
		}
		else {
			this.renderPlain()
		}
	}

	constructor() {
		super()
		let template = this.querySelector('template')
		if (!template) {
			throw 'virtual-repeat must contain \'template\' element'
		}
		if (template.content.childElementCount < 1) {
			throw 'virtual-repeat template must contain an element'
		}
		if (template.content.childElementCount > 1) {
			throw 'virtual-repeat template must contain only 1 element'
		}
		template.remove()
		this.template = template
	}

	connectedCallback() {
		this.shadowRoot.querySelector('#container').addEventListener('scroll', () => {
			this.render()
		}, {passive: true})
	}

	_createElement(key, item) {
		let content = this.template.content.cloneNode(true)
		let bindings = new Bindings(content)
		bindings.connect(this.getRootNode().host)
		bindings.state = {[this.as]: item}
		bindings.update()
		let element = content.firstElementChild
		if (this.key) {
			this._physicalElementsByKey.set(item[this.key], {element, bindings})
		}
		else {
			this._bindingsByElement.set(element, bindings)
		}
		return element
	}

	_removeElement(key, element) {
		if (this.key) {
			let {element, bindings} = this._physicalElementsByKey.get(key)
			bindings.disconnect()
			element.remove()
			this._physicalElementsByKey.delete(key)
		}
		else {
			let bindings = this._bindingsByElement.get(element)
			bindings.disconnect()
			element.remove()
			this._bindingsByElement.delete(element)
		}
	}

	_placeElement(element, index) {
		let child = this.children[index]
		if (child) {
			child.before(element)
		}
		else {
			this.append(element)
		}
	}

	// ensure element count and update bindings
	renderPlain() {
		let diff = this.items.length - this.childElementCount
		let container = this.shadowRoot.querySelector('#container')
		let canAddMoreElements = () => {
			if (this.childElementCount === this.items.length) {
				return false
			}
			else if (container.scrollHeight > container.offsetHeight + this._prerenderHeight + container.scrollTop) {
				return false
			}
			return true
		}

		// remove extra elements
		if (diff < 0) {
			for (let i = 0; i > diff; i--) {
				this._removeElement(null, this.lastElementChild)
			}
		}
		else if (diff > 0) {
			let ok = canAddMoreElements()
			let i = 0
			while (ok) {
				let item = this.items[this.childElementCount + i]
				console.log(item, ok)
				let element = this._createElement(item[this.key], item)
				this.append(element)
				i++
				ok = canAddMoreElements()
			}
		}

		// update bindings
		[...this._bindingsByElement.values()].forEach((bindings, i) => {
			bindings.state = {[this.as]: this.items[i]}
			bindings.update()
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
				physical.bindings.update()
			}
			else {
				let element = this._createElement(item[this.key], item)
				this._placeElement(element, index)
			}
		})

		// sort elements
		let sort = () => {
			let children = [...this.children]
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