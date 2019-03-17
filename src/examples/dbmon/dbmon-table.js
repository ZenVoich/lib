import define from '../../decorators/class/define.js'
import {afterNextRender} from '../../utils/renderer.js'

import template from './dbmon-table.html'

@define('dbmon-table')
class DbmonTable extends HTMLElement {
	static template = template

	connectedCallback() {
		this.refresh()
	}

	refresh() {
		this.databases = ENV.generateData(true).toArray()
		Monitoring.renderRate.ping()
		// afterNextRender(this, Monitoring.renderRate.ping)
		setTimeout(() => this.refresh(), ENV.timeout);
	}
}