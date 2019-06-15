import {PropertySourceExpression} from './source-expressions/property-source-expression.js'
import {PathSourceExpression} from './source-expressions/path-source-expression.js'
import {ValueSourceExpression} from './source-expressions/value-source-expression.js'
import {CompoundSourceExpression} from './source-expressions/compound-source-expression.js'
import {parse as parseSourceExpressionChunk} from './source-expressions/source-expression-parser.js'

import {PropertyTargetExpression} from './target-expressions/property-target-expression.js'
import {parseSkeleton as parseTargetExpressionSkeleton} from './target-expressions/target-expression-parser.js'

import {Binding} from './binding.js'
import {perf} from '../utils/perf.js'

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
	let source = parseSourceExpressionMemoized(value)
	perf.markEnd('bindings: parse source')
	perf.markStart('bindings: parse target')
	let targetSkeleton = parseTargetExpressionSkeleton('attribute', attr, source)
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

	let binding = createBinding(source, targetSkeleton)
	if (!binding) {
		return
	}

	el.removeAttribute(attr)
	return binding
}

let parseNode = (node) => {
	perf.markStart('bindings: parse source')
	let source = parseSourceExpressionMemoized(node.textContent)
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

	let binding = createBinding(source, targetSkeleton)
	if (!binding) {
		return
	}
	return binding
}

let createBinding = (source, targetSkeleton) => {
	let direction = targetSkeleton.twoWayBind ? 'two-way' : 'downward'
	if (direction !== 'downward' && source instanceof CompoundSourceExpression) {
		console.error('two-way binding can only contain one bidning on right-side')
		return
	}
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

let sourceExprRegex = /\{(!?)(.*?)\}/

let parseSourceExpression = (text) => {
	let chunks = [text]

	let findAndReplace = () => {
		let nextChunk
		let nextChunkIndex
		let match

		for (let [index, chunk] of chunks.entries()) {
			if (typeof chunk !== 'string') {
				continue
			}
			match = chunk.match(sourceExprRegex)
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

		findAndReplace()
	}
	findAndReplace()

	chunks = chunks.filter(x => x)

	let noExpressions = !chunks.length || chunks.every((chunk) => {
		return typeof chunk === 'string'
	})
	if (noExpressions) {
		return
	}

	let expressions = chunks.filter(x => x).map((chunk) => {
		if (typeof chunk === 'string') {
			return new ValueSourceExpression({value: chunk})
		}
		return chunk
	})

	// single expression
	if (expressions.length === 1) {
		return expressions[0]
	}

	// compound expression
	return new CompoundSourceExpression({chunks: expressions})
}