import {FragmentContainer} from './fragment-container.js'
import {perf} from '../../utils/perf.js'

export class RepeatObject {
	host
	item
	templateRoot
	fragmentContainer
	as

	constructor(templateRoot, as) {
		this.templateRoot = templateRoot
		this.as = as
		this.fragmentContainer = new FragmentContainer(templateRoot.content)
	}

	connect(host, item, {dirtyCheck = false} = {}) {
		if (this.host) {
			throw 'RepeatObject: already connected'
		}

		this.host = host
		this.item = item

		this.templateRoot.connect(this.host, dirtyCheck)
	}

	disconnect() {
		if (!this.host) {
			return
		}
		this.templateRoot.disconnect()
		this.host = null
	}

	remove() {
		this.disconnect()
		this.fragmentContainer.remove()
		this.item = null
	}

	update() {
		this.templateRoot.update()
	}

	render() {
		this.templateRoot.render()
	}
}