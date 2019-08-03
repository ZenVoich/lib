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

// equality
assertRender(`<b class|x="{x === 'a'}"></b>`, {x: 'a'}, '<b class="x"></b>')
assertRender(`<b class|x="{x == 'a'}"></b>`, {x: 'a'}, '<b class="x"></b>')
assertRender(`<b class|x="{x=='a'}"></b>`, {x: 'a'}, '<b class="x"></b>')
assertRender(`<b class|x="{x == x}"></b>`, {x: 'a'}, '<b class="x"></b>')
assertRender(`<b class|x="{'aa' == 'aa'}"></b>`, {x: 'a'}, '<b class="x"></b>')
assertRender(`<b class|x="{'a' == 'aa'}"></b>`, {x: 'a'}, '<b></b>')
assertRender(`<b class|x="{x !== 'a'}"></b>`, {x: 'a'}, '<b></b>')
assertRender(`<b class|x="{x != 'a'}"></b>`, {x: 'a'}, '<b></b>')
assertRender(`<b class|x="{x === 'a'}"></b>`, {x: 'b'}, '<b></b>')
assertRender(`<b test="{xx === 'a'}"></b>`, {xx: 'a'}, '<b test=""></b>')
assertRender(`<b test="{xy === 'a'}"></b>`, {xy: 'b'}, '<b></b>')
assertRender(`<b test="{x ==== 'a'}"></b>`, {x: 'b'}, `<b test="{x ==== 'a'}"></b>`)
assertRender(`<b class|x="{x > 0}"></b>`, {x: 1}, '<b class="x"></b>')
assertRender(`<b class|x="{0 < x}"></b>`, {x: 1}, '<b class="x"></b>')
assertRender(`<b class|x="{x > 1}"></b>`, {x: 1}, '<b></b>')
assertRender(`<b class|x="{x < 2}"></b>`, {x: 1}, '<b class="x"></b>')
assertRender(`<b class|x="{2 > x}"></b>`, {x: 1}, '<b class="x"></b>')
assertRender(`<b class|x="{x < 0}"></b>`, {x: 1}, '<b></b>')
assertRender(`<b class|x="{x >= 1}"></b>`, {x: 1}, '<b class="x"></b>')
assertRender(`<b class|x="{x <= 1}"></b>`, {x: 1}, '<b class="x"></b>')
assertRender(`<b class|x="{x <= 0}"></b>`, {x: 1}, '<b></b>')
assertRender(`<b class|x="{0 >= x}"></b>`, {x: 1}, '<b></b>')
assertRender(`<b class|x="{0 < 1}"></b>`, {x: 1}, '<b class="x"></b>')
assertRender(`<b class|x="{0 < 0}"></b>`, {x: 1}, '<b></b>')
assertRender(`<b class|x="{x < y}"></b>`, {x: 1, y: 2}, '<b class="x"></b>')
assertRender(`<b class|x="{y < x}"></b>`, {x: 1, y: 2}, '<b></b>')

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

// style attribute value part
assertRender('<b style|not-valid="{x}"></b>', {x: 'a'}, '<b></b>')
assertRender('<b style|color="{x}"></b>', {x: null}, '<b></b>')
assertRender('<b style|color="{x}"></b>', {x: ''}, '<b></b>')
assertRender('<b style|color="{x}"></b>', {x: true}, '<b></b>')
assertRender('<b style|color="{x}"></b>', {x: 'red'}, '<b style="color: red;"></b>')
assertRender('<b style|border-top="2px solid {x}"></b>', {x: 'red'}, '<b style="border-top: 2px solid red;"></b>')
assertRender('<b style|border-top="2px solid {x}"></b>', {x: 'invalid'}, '<b></b>')
assertRender('<b style|color="{x}"></b>', {x: 'not-a-collor'}, '<b></b>')
assertRender('<b style|color="{x}"></b>', {x: 'var(--some-var)'}, '<b style="color: var(--some-var);"></b>')
assertRender('<b style|background-color="blue"></b>', {}, '<b style="background-color: blue;"></b>')
assertRender('<b style="color: blue; text-align: center;" style|text-align="{x}"></b>', {x: 'left'}, '<b style="color: blue; text-align: left;"></b>')
assertRender('<b style="color: blue; text-align: center;" style|text-align="{x}"></b>', {x: 'invalid'}, '<b style="color: blue; text-align: center;"></b>')

// .inner-html
assertRender('<b>{data}</b>', {data: '<i>a</i>'}, '<b>&lt;i&gt;a&lt;/i&gt;</b>')
assertRender('<b .inner-html="{data}"></b>', {data: '<i>a</i>'}, '<b><i>a</i></b>')


// properties
assertElement('<b .prop></b>', {}, (el, tr) => {
	if (el.prop !== '') {
		return 'expected .prop to be "" (empty string), actual ' + el.prop
	}
})

assertElement('<b .prop="{true}"></b>', {}, (el, tr) => {
	if (el.prop !== true) {
		return 'expected .prop to be true (boolean), actual ' + el.prop
	}
})

assertElement('<b .prop="{false}"></b>', {}, (el, tr) => {
	if (el.prop !== false) {
		return 'expected .prop to be false (boolean), actual ' + el.prop
	}
})

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