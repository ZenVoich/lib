export class TemplatePart {
	host
	relatedPaths
	static parse(root, attr) {}
	connect(host) {}
	disconnect() {}
	update(state) {}
	updatePath(state, path) {}
}