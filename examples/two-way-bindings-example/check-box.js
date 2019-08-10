import {tag, markup} from '../../src/lib.js'
import {attr} from '../../src/decorators/prop/attr.js'
import {upstream} from '../../src/decorators/prop/upstream.js'
import {watch} from '../../src/decorators/method/watch.js'

@tag('check-box')
@markup(`<input type=checkbox .checked={checked} @change={onChange}>`)
class TestElement extends HTMLElement {
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