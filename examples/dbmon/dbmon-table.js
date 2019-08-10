import {tag, markup, styles} from '../../src/lib.js'
import {afterNextRender} from '../../src/utils.js'

@tag('dbmon-table')
@markup(import('./dbmon-table.html'))
@styles(import('./dbmon/styles.css'))
class DbmonTable extends HTMLElement {
	// static dirtyCheck = true

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