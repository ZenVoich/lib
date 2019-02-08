export default (Class) => {
	return class extends Class {
		init() {}
		connectedCallback() {}
		disconnectedCallback() {}
		attributeChangedCallback() {}
		propertyChangedCallback() {}
	}
}