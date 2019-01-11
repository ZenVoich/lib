let currentStats = null
let stats = {
	start() {
		currentStats = {}
	},
	stop() {
		let temp = currentStats
		currentStats = null
		return temp
	},
	increment(key) {
		if (!currentStats) {
			return
		}
		currentStats[key] = (currentStats[key] || 0) + 1
	},
}

stats = window.__stats || stats
window.__stats = stats

export default stats