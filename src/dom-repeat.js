import define from './decorators/class/define.js'
import Initial from './mixins/initial.js'
import Template from './mixins/template.js'
import PropertyObserver from './mixins/property-observer.js'
import {Bindings} from './bindings/bindings.js'


@define('dom-repeat')
class DomRepeat extends PropertyObserver(Template(Initial(HTMLElement))) {
	static template = '<style>:host {display: contents;}</style><slot></slot>'
	static observedProperties = ['items', 'as']

	if = false;
	_physicalElementsByKey = new Map;
	#raf;

	constructor() {
		super()
		this.template = this.querySelector('template')
		this.template.remove()
	}

	propertyChangedCallback(prop, old) {
		this.render()
	}

	_createElement(key, item) {
		let content = this.template.content.cloneNode(true)
		let bindings = new Bindings(content)
		bindings.connect(this.getRootNode().host)
		// bindings.host = this.getRootNode().host
		bindings.state = {item}
		bindings.update()
		// console.log(bindings)
		let element = content.firstElementChild
		this._physicalElementsByKey.set(item.key, {element, bindings})
		return element
	}

	_removeElement(key) {
		let {element, bindings} = this._physicalElementsByKey.get(key)
		bindings.disconnect()
		element.remove()
		this._physicalElementsByKey.delete(key)
	}

	_placeElement(element, index) {
		let child = this.children[index]
		if (child) {
			child.insertAdjacentElement('beforeBegin', element)
		} else {
			this.appendChild(element)
		}
	}

	render() {
		// remove elements
		let removedElements = []
		let currentKeys = new Set(this._physicalElementsByKey.keys())
		this.items.forEach((item) => {
			currentKeys.delete(item.key)
		})
		currentKeys.forEach((key) => {
			this._removeElement(key)
		})

		// add/update elements
		this.items.forEach((item, index) => {
			let physical = this._physicalElementsByKey.get(item.key)
			if (physical) {
				physical.bindings.update()
			} else {
				let element = this._createElement(item.key, item)
				this._placeElement(element, index)
			}
		})

		// sort elements
		let sort = () => {
			let children = [...this.children]
			let itemsInfo = this.items.map((item, newIndex) => {
				let physical = this._physicalElementsByKey.get(item.key)
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