import define from '../../src/decorators/class/define.js'
import {afterNextRender} from '../../src/utils/renderer.js'

import template from './dbmon-table.html'
import styles from './dbmon/styles.css'

@define('dbmon-table')
class DbmonTable extends HTMLElement {
	static template = template
	static styles = styles

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