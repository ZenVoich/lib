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

	getValue(state) {
		return state[this.propertyName]
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

	isPropRelated(prop) {
		return prop == this.path[0]
	}
}

// export class FunctionSourceExpression {
// 	functionName = ''

// 	setValue(state, value) {
// 		state[this.functionName] = value
// 	}

// 	getValue(state) {
// 		return state[this.functionName]
// 	}

// 	isPropRelated(prop) {
// 		return prop == this.functionName
// 	}
// }

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

	getValue(state) {
		return this.chunks.map(expr => expr.getValue(state)).join('')
	}

	isPropRelated(prop) {
		return this.chunks.some((expr) => {
			return expr.isPropRelated(prop)
		})
	}
}