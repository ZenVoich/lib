export default (name) => {
	return (def) => {
		def.finisher = (Class) => {
			customElements.define(name, class extends Class {
				constructor() {
					super()
					this.ready()
				}
			})
		}
		return def
	}
}