import {TemplatePart} from './template-part.js'
import {parseSkeleton, fromSkeleton} from '../bindings-parser.js'
import {perf} from '../../utils/perf.js'

export class BindingsTemplatePart extends TemplatePart {
	host = null
	isConnected = false
	dirtyCheck = false
	relatedPaths

	bindings = [] // [Binding]

	static parseSkeleton(root) {
		return parseSkeleton(root)
	}

	static fromSkeleton({bindingSkeletons, relatedPaths}, root) {
		return new BindingsTemplatePart(fromSkeleton(bindingSkeletons, root), relatedPaths)
	}

	constructor(bindings, relatedPaths) {
		super()
		this.bindings = bindings
		this.relatedPaths = relatedPaths
	}

	connect(host, {dirtyCheck = false} = {}) {
		this.bindings.forEach((binding) => {
			binding.connect(host)
		})
		this.host = host
		this.dirtyCheck = dirtyCheck
		this.isConnected = true
	}

	disconnect() {
		this.bindings.forEach((binding) => {
			binding.disconnect()
		})
		this.host = null
		this.isConnected = false
	}

	update(state, paths, ignoreUndefined) {
		this.action('microtask', state, paths, ignoreUndefined)
	}

	render(state, paths, ignoreUndefined) {
		this.action('animationFrame', state, paths, ignoreUndefined)
	}

	action(phase, state, paths, ignoreUndefined) {
		if (!this.isConnected) {
			return
		}

		this.bindings.forEach((binding) => {
			if (binding.target.constructor.updatePhase !== phase) {
				return
			}
			if (paths) {
				for (let path of paths) {
					if (this._isBindingRelated(binding, path, phase)) {
						binding.pushValue(state, ignoreUndefined)
						break
					}
				}
			}
			else {
				binding.pushValue(state, ignoreUndefined)
			}
		})
	}

	_isBindingRelated(binding, path, phase) {
		if (binding.target.constructor.updatePhase !== phase) {
			return false
		}
		if (this.dirtyCheck) {
			for (let p of binding.source.relatedPaths) {
				if (p === path || p.startsWith(path + '.')) {
					return true
				}
			}
		} else {
			return binding.isPathRelated(path)
		}
	}
}

window.BindingsTemplatePart = BindingsTemplatePart