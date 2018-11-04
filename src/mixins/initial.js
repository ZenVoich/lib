export default (Class) => {
	return class extends Class {
		ready() {}
		connectedCallback() {}
		disconnectedCallback() {}
		attributeChangedCallback() {}
		propertyChangedCallback() {}
	}
}