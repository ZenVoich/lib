export class TemplatePart {
	host
	relatedPaths
	static parse(root, attr) {}
	connect(host) {}
	disconnect() {}
	update(state, paths, ignoreUndefined) {}
	render(state, paths, ignoreUndefined) {}
}