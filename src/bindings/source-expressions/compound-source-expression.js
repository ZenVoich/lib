import SourceExpression from './source-expression.js'
import {varName} from './regex.js'

export default class CompoundSourceExpression extends SourceExpression {
	chunks = [] // [SourceExpression]

	constructor({chunks} = {}) {
		super()
		this.chunks = chunks
	}

	getValue(state) {
		return this.chunks.map(expr => expr.getValue(state)).join('')
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