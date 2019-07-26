import {tag} from '../../src/decorators/class/tag.js'
import {attr} from '../../src/decorators/prop/attr.js'
import {upstream} from '../../src/decorators/prop/upstream.js'
import {watch} from '../../src/decorators/method/watch.js'

@tag('check-box')
class TestElement extends HTMLElement {
	static template = `
		<input type=checkbox .checked={checked} @change={onChange}>
	`

	@attr
	@upstream
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