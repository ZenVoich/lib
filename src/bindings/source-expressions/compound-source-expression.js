import {SourceExpression} from './source-expression.js'
import {varNameRegex} from './regex.js'

export class CompoundSourceExpression extends SourceExpression {
	chunks = [] // [SourceExpression]

	constructor({chunks} = {}) {
		super()
		this.chunks = chunks

		this.relatedPaths = new Set
		chunks.forEach((expr) => {
			expr.relatedPaths.forEach((path) => {
				this.relatedPaths.add(path)
			})
		})
	}

	getValue(state) {
		return this.chunks.map(expr => expr.getValue(state)).join('')
	}
}