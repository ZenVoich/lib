import PropertySourceExpression from './source-expressions/property-source-expression.js'
import PathSourceExpression from './source-expressions/path-source-expression.js'
import ValueSourceExpression from './source-expressions/value-source-expression.js'
import CompoundSourceExpression from './source-expressions/compound-source-expression.js'
import {parse as parseSourceExpressionChunk} from './source-expressions/source-expression-parser.js'

import PropertyTargetExpression from './target-expressions/property-target-expression.js'
import {parse as parseTargetExpression} from './target-expressions/target-expression-parser.js'

import Binding from './binding.js'
import perf from '../utils/perf.js'

let sourceExpressionsCache = new Map

export let parse = (template) => {
	if (!template) {
		return []
	}

	let bindings = []

	let addBinding = (binding) => {
		if (binding) {
			bindings.push(binding)
		}
	}

	![...template.querySelectorAll('*')].forEach((el) => {
		// attributes
		el.getAttributeNames().forEach((attr) => {
			addBinding(parseAttribute(el, attr))
		})

		// nodes
		let textNodesOnly = [...el.childNodes].every((node) => {
			return node.nodeType === document.TEXT_NODE
		})
		if (textNodesOnly) {
			addBinding(parseNode(el))
		}
		else {
			![...el.childNodes].forEach((node) => {
				if (node.nodeType === document.TEXT_NODE) {
					addBinding(parseNode(node))
				}
			})
		}
	})

	// root text nodes
	![...template.childNodes].forEach((node) => {
		if (node.nodeType === document.TEXT_NODE) {
			addBinding(parseNode(node))
		}
	})

	return bindings
}

let parseAttribute = (el, attr) => {
	perf.markStart('bindings: parse source')
	let value = el.getAttribute(attr)
	let [source, direction] = parseSourceExpressionMemoized(value)
	perf.markEnd('bindings: parse source')
	perf.markStart('bindings: parse target')
	let target = parseTargetExpression('attribute', el, attr, source)
	perf.markEnd('bindings: parse target')

	if (!target) {
		return
	}

	// <div .prop="val">
	if (!source) {
		if (target instanceof PropertyTargetExpression) {
			source = new ValueSourceExpression({value: el.getAttribute(attr)})
		}
		else {
			return
		}
	}

	let binding = createBinding(direction, source, target)
	if (!binding) {
		return
	}

	el.removeAttribute(attr)
	return binding
}

let parseNode = (node) => {
	perf.markStart('bindings: parse source')
	let [source, direction] = parseSourceExpressionMemoized(node.textContent)
	perf.markEnd('bindings: parse source')
	if (!source) {
		return
	}

	perf.markStart('bindings: parse target')
	let target = parseTargetExpression('node', node)
	perf.markEnd('bindings: parse target')
	if (!target) {
		return
	}

	let binding = createBinding(direction, source, target)
	if (!binding) {
		return
	}
	return binding
}

let createBinding = (direction, source, target) => {
	if (direction !== 'downward' && !(target instanceof PropertyTargetExpression)) {
		console.error('upward and two-way binding can only be property binding')
		return
	}
	return new Binding(direction, source, target)
}

export let parseSourceExpressionMemoized = (text) => {
	if (sourceExpressionsCache.has(text)) {
		return sourceExpressionsCache.get(text)
	}
	let result = parseSourceExpression(text)
	sourceExpressionsCache.set(text, result)
	return result
}

let parseSourceExpression = (text) => {
	let chunks = [text]
	let downwardOnly = true
	let bindingDirection = ''

	let findAndReplace = (direction, regex) => {
		let nextChunk
		let nextChunkIndex
		let match

		for (let [index, chunk] of chunks.entries()) {
			if (typeof chunk !== 'string') {
				continue
			}
			match = chunk.match(regex)
			if (match) {
				nextChunk = chunk
				nextChunkIndex = index
				break
			}
		}

		if (!match) {
			return
		}

		let expr = parseSourceExpressionChunk(match[2], {negate: !!match[1]})
		if (!expr) {
			return
		}
		let [pre, ...post] = nextChunk.split(match[0])
		chunks.splice(nextChunkIndex, 1, pre, expr, post.join(match[0]))

		if (direction !== 'downward') {
			downwardOnly = false
		}
		bindingDirection = direction

		findAndReplace(direction, regex)
	}
	findAndReplace('downward', /\[\[(!?)(.*?)\]\]/)
	findAndReplace('upward', /\(\((!?)(.*?)\)\)/)
	findAndReplace('two-way', /\{\{(!?)(.*?)\}\}/)

	chunks = chunks.filter(x => x)

	let noExpressions = !chunks.length || chunks.every((chunk) => {
		return typeof chunk === 'string'
	})
	if (noExpressions) {
		return []
	}

	let expressions = chunks.filter(x => x).map((chunk) => {
		if (typeof chunk === 'string') {
			return new ValueSourceExpression({value: chunk})
		}
		return chunk
	})

	// single expression
	if (expressions.length === 1) {
		let expr = expressions[0]

		if (bindingDirection !== 'downward' && !(expr instanceof PropertySourceExpression) && !(expr instanceof PathSourceExpression)) {
			console.error('upward and two-way binding can only be property binding', `"${text}"`)
			return []
		}

		return [expr, bindingDirection]
	}

	// compound expression
	if (!downwardOnly) {
		console.error('compound binding can only contain downward bindings', `"${text}"`)
		return []
	}
	return [new CompoundSourceExpression({chunks: expressions}), bindingDirection]
}