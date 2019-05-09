import {define} from '../../src/decorators/class/define.js'
import {attr} from '../../src/decorators/prop/attr.js'
import {notify} from '../../src/decorators/prop/notify.js'
import {watch} from '../../src/decorators/method/watch.js'

@define('check-box')
class TestElement extends HTMLElement {
	static template = `
		<input type=checkbox .checked={checked} @change={onChange}>
	`

	@attr
	@notify
	checked = true

	// @watch('checked')
	_checkedChange(old) {
		// console.trace('@watch checked')
	}

	onChange(e) {
		this.checked = e.currentTarget.checked
		console.log(e.currentTarget.checked)
	}
}