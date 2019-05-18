import {assertRender, assertElement} from './utils.js'

// static bindings
assertRender('', {}, '')
assertRender(' ', {}, ' ')
assertRender('a', {}, 'a')
assertRender('ab', {x: 1}, 'ab')
assertRender("{''}", {}, '')
assertRender("{'val'}", {}, 'val')
assertRender('{"a"}', {}, '{"a"}')
assertRender("{12}", {}, '12')
assertRender("{12.54}", {}, '12.54')
assertRender("{12.54.1}", {}, '{12.54.1}')

// single bindings
assertRender('{x}', {}, '')
assertRender('{x}', {x: null}, '')
assertRender('{x}', {x: undefined}, '')
assertRender('{x}', {x: 0}, '0')
assertRender('{xy}', {xy: 1}, '1')
assertRender('{x}', {x: {}}, '[object Object]')
assertRender('{x}', {x: []}, '')
assertRender('{x}', {x: [1, 2, 3]}, '1,2,3')
assertRender('{x}', {x: () => {}}, '() =&gt; {}')

// compound bindings
assertRender('{x} {y}', {x: 1, y: 2}, '1 2')
assertRender('{x}{y}', {x: 1, y: 2}, '12')
assertRender('{x} {y}', {x: 1}, '1 ')
assertRender('{x} {y}', {y: 2}, ' 2')
assertRender('{x} {y}', {}, ' ')
assertRender('{x}{y}', {}, '')

// path bindings
assertRender('{x.y}', {x: {y: 1}}, '1')
assertRender('{x.y.z}', {}, '')
assertRender('{x.y.z}{y.y.y}', {}, '')
assertRender('{x.y.z}', {x: {}}, '')
assertRender('{x.y}', {x: {y: [1, 2, 3]}}, '1,2,3')
assertRender('{x.y.length}', {x: {y: [1, 2, 3]}}, '3')
assertRender('{x.y.1}', {x: {y: [1, 2, 3]}}, '2')
assertRender('{x.y.1.z}', {x: {y: [1, {z: 'z'}, 3]}}, 'z')
assertRender('{x.y.z}', {x: {y: 1}}, '')
assertRender('{x.y.z}', {x: {y: {z: 1}}}, '1')
assertRender('{x.y.z}{x.a}', {x: {y: {z: 1}, a: 2}}, '12')

// attributes
assertRender('<b id={x}></b>', {x: 'a'}, '<b id="a"></b>')
assertRender('<b id={x}></b>', {x: {y: 1}}, '<b id="[object Object]"></b>')
assertRender('<b id={x}></b>', {x: [1, 2, 3]}, '<b id="1,2,3"></b>')
assertRender('<b id={x}></b>', {x: () => {}}, '<b id="() => {}"></b>')
assertRender('<b id={x} a={x}></b>', {x: ''}, '<b id="" a=""></b>')
assertRender('<b id={x} a=x></b>', {x: ''}, '<b a="x" id=""></b>')
assertRender('<b id="x: {x}" a={x}></b>', {x: 'a'}, '<b id="x: a" a="a"></b>')
assertRender('<b id="{x}-{y}" a={x}></b>', {x: 'a', y: 'b'}, '<b id="a-b" a="a"></b>')

// boolean attributes
assertRender('<b id={x}></b>', {}, '<b></b>')
assertRender('<b id={x}></b>', {x: null}, '<b></b>')
assertRender('<b id={x}></b>', {x: undefined}, '<b></b>')
assertRender('<b id={x}></b>', {x: false}, '<b></b>')
assertRender('<b id={x}></b>', {x: true}, '<b id=""></b>')
assertRender('<b id={x} a="{x}"></b>', {x: true}, '<b id="" a=""></b>')
assertRender('<b id=a-{x}></b>', {x: true}, '<b id="a-true"></b>')
assertRender('<b id=a-{x}></b>', {x: false}, '<b id="a-false"></b>')
assertRender('<b id={x}-b></b>', {x: false}, '<b id="false-b"></b>')
assertRender('<b id={x}-{y}></b>', {x: true, y: true}, '<b id="true-true"></b>')
assertRender('<b id={x}{y}></b>', {x: false, y: false}, '<b id="falsefalse"></b>')
assertRender('<b id={x}{y}></b>', {x: true, y: false}, '<b id="truefalse"></b>')

// class attribute value part
assertRender('<b class|yes="{x}"></b>', {}, '<b></b>')
assertRender('<b class|yes="{x}"></b>', {x: null}, '<b></b>')
assertRender('<b class|yes="{x}"></b>', {x: ''}, '<b></b>')
assertRender('<b class|yes="{x}"></b>', {x: true}, '<b class="yes"></b>')
assertRender('<b class|yes="{x}"></b>', {x: 'a'}, '<b class="yes"></b>')
assertRender('<b class="s" class|yes="{x}"></b>', {x: false}, '<b class="s"></b>')
assertRender('<b class="s" class|yes="{x}"></b>', {x: true}, '<b class="s yes"></b>')
assertRender('<b class="s" class|yes="{x}" class|no="{y}"></b>', {x: true, y: true}, '<b class="s yes no"></b>')
assertRender('<b class|yes="{x}" class|no="{y}"></b>', {x: true, y: true}, '<b class="yes no"></b>')
assertRender('<b class|yes="{x}" class|no="{y}"></b>', {x: false, y: true}, '<b class="no"></b>')
assertRender('<b class="yes" class|yes="{x}" class|no="{y}"></b>', {x: false, y: true}, '<b class="no"></b>')
assertRender('<b class="no" class|yes="{x}" class|no="{y}"></b>', {x: false, y: true}, '<b class="no"></b>')

// .inner-html
assertRender('<b>{data}</b>', {data: '<i>a</i>'}, '<b>&lt;i&gt;a&lt;/i&gt;</b>')
assertRender('<b .inner-html="{data}"></b>', {data: '<i>a</i>'}, '<b><i>a</i></b>')


// properties
assertElement('<b .prop="123"></b>', {}, (el, tr) => {
	if (el.prop !== '123') {
		return 'expected .prop to be 123 (string), actual ' + el.prop
	}
})

assertElement('<b .prop="{1}"></b>', {}, (el, tr) => {
	if (el.prop !== 1) {
		return 'expected .prop to be 1 (number), actual ' + el.prop
	}
})

assertElement('<b .prop="{1}2"></b>', {}, (el, tr) => {
	if (el.prop !== '12') {
		return 'expected .prop to be 12 (string), actual ' + el.prop
	}
})

assertElement('<b .prop="{pp}"></b>', {pp: 55}, (el, tr) => {
	if (el.prop !== 55) {
		return 'expected .prop to be 55 (number), actual ' + el.prop
	}
})

assertElement('<b .prop="{pp}" .p="{pp}"></b>', {pp: 55}, (el, tr) => {
	if (el.prop !== 55 || el.p !== 55) {
		return 'expected .prop and .p to be 55 (number), actual ' + `.prop=${el.prop} and .p=${el.p}`
	}
})

assertElement('<b .prop-val="{pp}"></b>', {pp: 55}, (el, tr) => {
	if (el.propVal !== 55) {
		return 'expected .propVal to be 55 (number), actual ' + el.propVal
	}
})


// .prop=fn()
assertElement('<b .prop="{fn()}"></b>', {fn: () => 99}, (el, tr) => {
	if (el.prop !== 99) {
		return 'expected .prop to be 99 (number), actual ' + el.prop
	}
})

assertElement('<b .prop="{fn(x)}"></b>', {fn: (x) => x, x: 'x'}, (el, tr) => {
	if (el.prop !== 'x') {
		return `expected .prop to be 'x', actual ` + el.prop
	}
})

assertElement(`<b .prop="{fn('a', 12, x, y, z)}"></b>`, {fn: (...args) => args.join(''), x: 3, z: 'z'}, (el, tr) => {
	if (el.prop !== 'a123z') {
		return `expected .prop to be 'a123z', actual ` + el.prop
	}
})

let thrown = false
try {
	assertElement('<b .prop="{f()}"></b>', {}, (el, tr) => {
		if (el.prop !== 55) {
			return 'expected .prop to be 55 (number), actual ' + el.prop
		}
	})
}
catch (e) {
	thrown = true
}
if (!thrown) {
	console.error(`'<b .prop="{f()}"></b>' with state`, {}, 'should throw an exception');
}

// @event={fn}
// #directives