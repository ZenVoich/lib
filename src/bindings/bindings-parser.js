import PropertySourceExpression from './source-expressions/property-source-expression.js'
import PathSourceExpression from './source-expressions/path-source-expression.js'
import ValueSourceExpression from './source-expressions/value-source-expression.js'
import CompoundSourceExpression from './source-expressions/compound-source-expression.js'
import {parse as parseSourceExpressionChunk} from './source-expressions/source-expression-parser.js'

import PropertyTargetExpression from './target-expressions/property-target-expression.js'
import {parse as parseTargetExpression, parseSkeleton as parseTargetExpressionSkeleton} from './target-expressions/target-expression-parser.js'

import Binding from './binding.js'
import perf from '../utils/perf.js'

let sourceExpressionsCache = new Map

export let parseSkeleton = (root) => {
	if (!root) {
		return []
	}

	perf.markStart('bindings.parseSkeleton')

	let bindingSkeletons = new Map
	let walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
	let curNode = walker.nextNode()
	let nodeIndex = -1

	let addBindingSkeleton = (bindingSkeleton) => {
		if (!bindingSkeleton) {
			return
		}
		let skeletons = bindingSkeletons.get(nodeIndex)
		if (!skeletons) {
			skeletons = new Set
			bindingSkeletons.set(nodeIndex, skeletons)
		}
		skeletons.add(bindingSkeleton)
	}

	while (true) {
		if (!curNode) {
			break
		}
		nodeIndex++

		// elements
		if (curNode.nodeType === document.ELEMENT_NODE) {
			// attributes
			let contenteditable = false
			curNode.getAttributeNames().forEach((attr) => {
				if (attr === 'contenteditable') {
					contenteditable = true
				}
				addBindingSkeleton(parseAttribute(curNode, attr))
			})

			// if [contenteditable] parse an element instead of text nodes
			if (contenteditable) {
				addBindingSkeleton(parseNode(curNode))
				// curNode = walker.nextSibling() || walker.nextNode()
				// continue
			}
		}
		// text nodes
		else {
			addBindingSkeleton(parseNode(curNode))
		}

		curNode = walker.nextNode()
	}

	perf.markEnd('bindings.parseSkeleton')

	return bindingSkeletons
}

export let fromSkeleton = (bindingSkeletons, root) => {
	perf.markStart('bindings.fromSkeleton')
	let walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
	let curNode = walker.nextNode()
	let nodeIndex = -1
	let bindings = []

	while (true) {
		if (!curNode) {
			break
		}
		nodeIndex++
		let skeletons = bindingSkeletons.get(nodeIndex)
		if (skeletons) {
			skeletons.forEach((skeleton) => {
				let target = skeleton.targetSkeleton.class.fromSkeleton(skeleton.targetSkeleton, curNode)
				bindings.push(new Binding(skeleton.direction, skeleton.source, target))
			})
		}
		curNode = walker.nextNode()
	}
	perf.markEnd('bindings.fromSkeleton')

	return bindings
}


let parseAttribute = (el, attr) => {
	perf.markStart('bindings: parse source')
	let value = el.getAttribute(attr)
	let [source, direction] = parseSourceExpressionMemoized(value)
	perf.markEnd('bindings: parse source')
	perf.markStart('bindings: parse target')
	let targetSkeleton = parseTargetExpressionSkeleton('attribute', el, attr, source)
	perf.markEnd('bindings: parse target')

	if (!targetSkeleton) {
		return
	}

	// <div .prop="val">
	if (!source) {
		if (targetSkeleton.class === PropertyTargetExpression) {
			source = new ValueSourceExpression({value: el.getAttribute(attr)})
		}
		else {
			return
		}
	}

	let binding = createBinding(direction, source, targetSkeleton)
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
	let targetSkeleton = parseTargetExpressionSkeleton('node', node)
	perf.markEnd('bindings: parse target')
	if (!targetSkeleton) {
		return
	}

	let binding = createBinding(direction, source, targetSkeleton)
	if (!binding) {
		return
	}
	return binding
}

let createBinding = (direction, source, targetSkeleton) => {
	if (direction !== 'downward' && targetSkeleton.class !== PropertyTargetExpression) {
		console.error('upward and two-way binding can only be property binding')
		return
	}
	// return new Binding(direction, source, target)
	return {direction, source, targetSkeleton}
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