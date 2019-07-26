export class TemplatePart {
	parentTemplateRoot
	relatedPaths

	static parseSkeleton(template, attribute) {}

	connect(host) {}
	disconnect() {}
	update(state, paths, ignoreUndefined) {}
	render(state, paths, ignoreUndefined) {}
}