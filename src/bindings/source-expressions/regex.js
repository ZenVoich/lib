export let varName = '[$a-z_][$a-z0-9_-]*'
export let pathPart = `(?:${varName}|[0-9]+)`
export let valueRegex = `(?:!?${varName}(?:\\.${varName})*|'[^']*'|[0-9]+)`