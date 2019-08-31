export let varNameRegex = '[$a-z_][$a-z0-9_-]*'
export let pathPartRegex = `(?:${varNameRegex}|[0-9]+|\\*)`
export let valueRegex = `(?:!?${varNameRegex}(?:\\.(?:${varNameRegex}|[0-9]+|\\*))*|'[^']*'|[0-9]+)`