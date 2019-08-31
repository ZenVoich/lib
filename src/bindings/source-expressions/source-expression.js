export class SourceExpression {
	negate = false
	relatedPaths

	static parse(text) {}

	setValue(states, value) {}
	getValue(states) {}
	negateValueIfNeeded(value) {
		return this.negate ? !value : value
	}
}