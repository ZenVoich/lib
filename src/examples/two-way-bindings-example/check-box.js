import define from '../../decorators/class/define.js'
import attr from '../../decorators/prop/attr.js'
import notify from '../../decorators/prop/notify.js'
import watch from '../../decorators/method/watch.js'
import Component from '../../component.js'

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