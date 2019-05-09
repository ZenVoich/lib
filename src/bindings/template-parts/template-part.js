let relatedProps = new Set

export class TemplatePart {
	static parse(root, attr) {}
	connect(host) {}
	disconnect() {}
	update(state) {}
	updateProp(state, prop) {}
	getRelatedProps() {
		return relatedProps
	}
}