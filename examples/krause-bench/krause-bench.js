import {tag, markup, styles} from '../../src/lib.js'

let startTime
let lastMeasure

let startMeasure = function(name) {
	startTime = performance.now()
	lastMeasure = name
}
let stopMeasure = function() {
	window.setTimeout(function() {
		let stop = performance.now()
		console.log(lastMeasure + ' took ' + (stop - startTime))
	}, 0)
}

@tag('krause-bench')
@markup(import('./krause-bench.html'))
@styles(import('./krause-bench.css'))
class KrauseBench extends HTMLElement {
	data = []
	did = 1
	selected

	add() {
		startMeasure('add')
		this.data = this.data.concat(this.buildData(1000))
		stopMeasure()
	}

	run() {
		startMeasure('run')
		this.data = this.buildData(1000)
		stopMeasure()
	}

	runLots() {
		startMeasure('runLots')
		this.data = this.buildData(10000)
		stopMeasure()
	}

	clear() {
		startMeasure('clear')
		this.data = []
		stopMeasure()
	}

	del(e) {
		startMeasure('delete')
		let index = this.data.indexOf(e.currentTarget.item)
		this.data.splice(index, 1)
		stopMeasure()
	}

	select(e) {
		startMeasure('select')
		this.selected = e.currentTarget.item.id
		stopMeasure()
	}

	swapRows() {
		startMeasure('swapRows')
		if (this.data.length > 998) {
			var tmp = this.data[1];
			this.data[1] = this.data[998];
			this.data[998] = tmp;
			this.data = this.data.slice()
		}
		stopMeasure()
	}

	update() {
		startMeasure('update')
		for (let i = 0; i < this.data.length; i += 10) {
			this.data[i].label = this.data[i].label + ' !!!'
		}
		stopMeasure()
	}


	buildData(count) {
		let adjectives = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy']
		let colours = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange']
		let nouns = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard']
		let data = []
		for (let i = 0; i < count; i++) {
			data.push({ id: this.did++, label: adjectives[this._random(adjectives.length)] + ' ' + colours[this._random(colours.length)] + ' ' + nouns[this._random(nouns.length)] })
		}
		return data
	}

	_random(max) {
		return Math.round(Math.random() * 1000) % max
	}
}