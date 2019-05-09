export class SourceExpression {
	negate = false

	negateValueIfNeeded(value) {
		return this.negate ? !value : value
	}

	static parse(text) {}
	setValue(state, value) {}
	getValue(state) {}
	getRelatedProps() {}
	isPropRelated(prop) {}
}