import {tag} from '../../src/lib.js'
import {perf} from '../../src/utils.js'
import {proxyObject} from '../../src/data-flow/proxy-object.js'

@tag('repeat-parent')
class RepeatParent extends HTMLElement {
	static template = import('./repeat-parent.html')

	top = 0
	items = proxyObject([
		proxyObject({
			key: 1,
			x: 1,
			y: 2,
			nested: proxyObject([
				proxyObject({n: 1}),
				proxyObject({n: 2}),
			])
		}),
		proxyObject({
			key: 2,
			x: 1,
			y: 2,
			nested: proxyObject([
				proxyObject({n: 1}),
				proxyObject({n: 2}),
			])
		}),
	])

	onClick(e) {
		// this.top++
		this.items[0].x++
		// this.items[1].x++
		this.items[0].nested[0].n++
		// this.items[0].nested[1].n++
		this.items[1].nested[1].n++
	}
}