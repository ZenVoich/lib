let pendingStats = new Map
let stats = {}
let running = false

let perf = {
	run() {
		running = true
	},
	stop() {
		stats = {}
		running = false
	},
	flush() {
		Object.keys(stats).forEach((key) => {
			stats[key] = +stats[key].toFixed(2)
		})
		console.log(stats)
		this.stop()
	},
	markStart(name) {
		if (!running) {
			return
		}
		if (pendingStats[name]) {
			console.warn(`perf: trying to start ${name} 2nd time before the 1st is finished`)
			return
		}
		pendingStats[name] = performance.now()
	},
	markEnd(name) {
		if (!running) {
			return
		}
		let duration = performance.now() - pendingStats[name]
		let totalDuration = stats[name] || 0
		stats[name] = totalDuration + duration
		delete pendingStats[name]
	},
}

perf = window.__perf || perf
window.__perf = perf

export default perf