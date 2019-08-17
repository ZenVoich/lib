import {tag, markup} from '../../src/lib.js'
import {perf} from '../../src/utils.js'

@tag('repeat-parent')
@markup(import('./repeat-parent.html'))
class RepeatParent extends HTMLElement {
	top = 0
	items = [
		{
			key: 1,
			x: 1,
			y: 2,
			nested: [
				{n: 1},
				{n: 2},
			]
		},
		{
			key: 2,
			x: 1,
			y: 2,
			nested: [
				{n: 1},
				{n: 2},
			]
		},
	]

	onClick(e) {
		// this.top++
		this.items[0].x++
		// this.items[1].x++
		this.items[0].nested[0].n++
		// this.items[0].nested[1].n++
		this.items[1].nested[1].n++
	}
}