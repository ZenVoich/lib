export class ValueSourceExpression {
	value = null

	constructor({value} = {}) {
		this.value = value
	}

	setValue(state, value) {
		this.value = value
	}

	getValue(state) {
		return this.value
	}

	getRelatedProps() {
		return new Set
	}

	isPropRelated(prop) {
		return false
	}
}

export class PropertySourceExpression {
	propertyName = ''

	constructor({propertyName} = {}) {
		this.propertyName = propertyName
	}

	setValue(state, value) {
		state[this.propertyName] = value
	}

	getValue(state, host) {
		return state[this.propertyName] || host && host[this.propertyName]
	}

	getRelatedProps() {
		return new Set([this.propertyName])
	}

	isPropRelated(prop) {
		return prop == this.propertyName
	}
}

export class PathSourceExpression {
	path = []

	constructor({path} = {}) {
		this.path = path
	}

	setValue(state, value) {
		let path = this.path.slice(0, -1)
		let object = state
		for (let prop of path) {
			if (!object[prop]) {
				return
			}
			object = object[prop]
		}
		object[this.path[this.path.length - 1]] = value
	}

	getValue(state) {
		let value = state
		for (let prop of this.path) {
			if (!value[prop]) {
				return
			}
			value = value[prop]
		}
		return value
	}

	getRelatedProps() {
		return new Set([this.path[0]])
	}

	isPropRelated(prop) {
		return prop == this.path[0]
	}
}

export class CallSourceExpression {
	functionName = ''
	args = [] // [SourceExpression]

	constructor({functionName, args} = {}) {
		this.functionName = functionName
		this.args = args
	}

	getValue(state) {
		return state[this.functionName](...this.args.map(expr => expr.getValue(state)))
	}

	getRelatedProps() {
		let props = new Set
		this.args.forEach((expr) => {
			expr.getRelatedProps().forEach((prop) => {
				props.add(prop)
			})
		})
		return props
	}

	isPropRelated(prop) {
		return this.args.some((expr) => {
			return expr.isPropRelated(prop)
		})
	}
}

export class CompoundSourceExpression {
	chunks = [] // [SourceExpression]

	constructor({chunks} = {}) {
		this.chunks = chunks
	}

	getValue(state, host) {
		return this.chunks.map(expr => expr.getValue(state, host)).join('')
	}

	getRelatedProps() {
		let props = new Set
		this.chunks.forEach((expr) => {
			expr.getRelatedProps().forEach((prop) => {
				props.add(prop)
			})
		})
		return props
	}

	isPropRelated(prop) {
		return this.chunks.some((expr) => {
			return expr.isPropRelated(prop)
		})
	}
}