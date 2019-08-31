import {SourceExpression} from './source-expression.js'
import {varNameRegex} from './regex.js'

export class ArgPlaceholderSourceExpression extends SourceExpression {
	static parse(text) {
		if (text === '?') {
			return new ArgPlaceholderSourceExpression
		}
	}

	relatedPaths = new Set
}