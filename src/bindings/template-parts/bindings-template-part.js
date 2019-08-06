import {TemplatePart} from './template-part.js'
import {parseSkeleton, fromSkeleton} from '../bindings-parser.js'
import {perf} from '../../utils/perf.js'

export class BindingsTemplatePart extends TemplatePart {
	host = null
	dirtyCheck = false
	relatedPaths

	bindings = [] // [Binding]

	static parseSkeleton(root) {
		return parseSkeleton(root)
	}

	constructor({bindingSkeletons, relatedPaths}, root) {
		super()
		this.bindings = fromSkeleton(bindingSkeletons, root)
		this.relatedPaths = relatedPaths
	}

	connect(host, {dirtyCheck = false} = {}) {
		this.bindings.forEach((binding) => {
			binding.connect(host)
		})
		this.host = host
		this.dirtyCheck = dirtyCheck
	}

	disconnect() {
		this.bindings.forEach((binding) => {
			binding.disconnect()
		})
		this.host = null
	}

	update(state, paths, ignoreUndefined) {
		this.action('microtask', state, paths, ignoreUndefined)
	}

	render(state, paths, ignoreUndefined) {
		this.action('render', state, paths, ignoreUndefined)
	}

	action(phase, state, paths, ignoreUndefined) {
		if (!this.host) {
			return
		}

		this.bindings.forEach((binding) => {
			if (binding.targetUpdatePhase !== phase) {
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
		if (binding.targetUpdatePhase !== phase) {
			return false
		}
		if (this.dirtyCheck) {
			for (let p of binding.relatedPaths) {
				if (p === path || p.startsWith(path + '.')) {
					return true
				}
			}
		}
		else {
			return binding.isPathRelated(path)
		}
	}
}

window.BindingsTemplatePart = BindingsTemplatePart