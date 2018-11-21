export default class Binding {
	direction = '' // downward | upward | two-way
	source = null // SourceExpression
	target = null // TargetExpression

	constructor(direction, source, target) {
		this.direction = direction
		this.source = source
		this.target = target
	}

	pushValue(state, host) {
		if (state && this.type !== 'upward') {
			this.target.setValue(this.source.getValue(state, host), state, host)
		}
	}

	pullValue(state) {
		if (state && this.type !== 'downward') {
			this.source.setValue(state, this.target.getValue())
		}
	}

	isPropRelated(prop) {
		return this.source.isPropRelated(prop)
	}

	dispose() {}
}