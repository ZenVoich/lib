export class SourceExpression {
	negate = false
	relatedPaths

	static parse(text) {}

	setValue(state, value) {}
	getValue(state) {}
	negateValueIfNeeded(value) {
		return this.negate ? !value : value
	}
}