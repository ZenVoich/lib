import define from '../../decorators/class/define.js'
import Component from '../../component.js'

import template from './dbmon-table.html'

@define('dbmon-table')
class DbmonTable extends Component {
	static template = template

	connectedCallback() {
		this.refresh()
	}

	refresh() {
		this.databases = ENV.generateData(true).toArray()
		Monitoring.renderRate.ping()
		// requestAnimationFrame(() => this.refresh())
		setTimeout(() => this.refresh(), ENV.timeout);
	}
}