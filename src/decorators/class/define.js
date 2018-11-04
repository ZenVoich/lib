export default (name) => {
	return (Class) => {
		customElements.define(name, class extends Class {
			constructor() {
				super()
				this.ready()
			}
		})
	}
}