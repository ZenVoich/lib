import {define} from '../../src/lib.js'
import {afterNextRender} from '../../src/utils.js'

@define('dbmon-table')
class DbmonTable extends HTMLElement {
	static template = import('./dbmon-table.html')
	static styles = import('./dbmon/styles.css')
	// static dirtyCheck = true
	databases = ENV.generateData(true).toArray()

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