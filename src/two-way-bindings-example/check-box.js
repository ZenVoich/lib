import define from '../decorators/class/define.js'
import Component from '../component.js'
import attr from '../decorators/prop/attr.js'
import notify from '../decorators/prop/notify.js'
import watch from '../decorators/method/watch.js'

@define('check-box')
class TestElement extends Component {
	static template = `
		<input type=checkbox .checked=[[checked]] on-change=[[onChange]]>
	`

	@attr
	@notify
	checked = true

	@watch('checked')
	_checkedChange(old) {
		// console.trace('@watch checked')
	}

	onChange(e) {
		this.checked = e.currentTarget.checked
		console.log(e.currentTarget.checked)
	}
}