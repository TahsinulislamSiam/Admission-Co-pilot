/**
 * Static UI audit.
 *
 *  1. every ROUTES constant is registered in the router (no dead links)
 *  2. every `to={ROUTES.x}` / `to="..."` points at a route that exists
 *  3. every <Button>/<button> has a handler (onClick), is a submit, or sits
 *     inside a <Link> (so it navigates) — otherwise it is a dead button
 */
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(p)
  }
  return out
}

const files = walk(path.join(root, 'src'))
const read = (p) => readFileSync(p, 'utf8')
const rel = (p) => path.relative(root, p).replace(/\\/g, '/')

// ---------------------------------------------------------------- routes
const constants = read(path.join(root, 'src/routes/constants.js'))
const routes = {}
for (const m of constants.matchAll(/^\s{2}(\w+):\s*'([^']+)'/gm)) routes[m[1]] = m[2]

const routerSrc = read(path.join(root, 'src/app/router.jsx'))
const registered = new Set(
  [...routerSrc.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1].replace(/^\//, ''))
)
// top-level routes use `path: ROUTES.name` instead of a literal
for (const m of routerSrc.matchAll(/path:\s*ROUTES\.(\w+)/g)) {
  const value = routes[m[1]]
  if (value) registered.add(value.replace(/^\//, ''))
}

const missingRoutes = []
for (const [name, value] of Object.entries(routes)) {
  const clean = value.replace(/^\//, '')
  const last = clean.split('/').pop()
  const ok =
    registered.has(clean) ||
    registered.has(last) ||
    // nested children are registered relative to their parent
    [...registered].some((r) => clean.endsWith(r))
  if (!ok) missingRoutes.push(`${name} → ${value}`)
}

// ------------------------------------------------------- link references
const badRefs = []
const linkTargets = new Set()
for (const file of files) {
  const src = read(file)
  for (const m of src.matchAll(/to=\{ROUTES\.(\w+)\}/g)) {
    linkTargets.add(m[1])
    if (!(m[1] in routes)) badRefs.push(`${rel(file)} → ROUTES.${m[1]} (unknown constant)`)
  }
  for (const m of src.matchAll(/to="(\/[^"]*)"/g)) {
    const clean = m[1].replace(/^\//, '')
    if (!registered.has(clean) && ![...registered].some((r) => clean.endsWith(r))) {
      badRefs.push(`${rel(file)} → "${m[1]}" (not in router)`)
    }
  }
  for (const m of src.matchAll(/navigate\((ROUTES\.\w+)/g)) {
    const key = m[1].replace('ROUTES.', '')
    if (!(key in routes)) badRefs.push(`${rel(file)} → navigate(${m[1]}) unknown`)
  }
}

// --------------------------------------------------------------- buttons
const deadButtons = []
for (const file of files) {
  if (/\.test\.(jsx?|tsx?)$/.test(file)) continue
  const src = read(file)
  const lines = src.split('\n')

  const tagRe = /<(Button|button)\b([^>]*)>/g
  for (const m of src.matchAll(tagRe)) {
    const attrs = m[2]
    const startLine = src.slice(0, m.index).split('\n').length
    const hasHandler =
      /onClick=/.test(attrs) ||
      /type=["']submit["']/.test(attrs) ||
      /asChild/.test(attrs) ||
      /\.\.\.props/.test(attrs) ||
      /\.\.\.\w+/.test(attrs)
    if (hasHandler) continue

    // inside a still-open <Link>/<a> wrapper? (counts as "navigates")
    const before = src.slice(0, m.index)
    const openIdx = Math.max(before.lastIndexOf('<Link'), before.lastIndexOf('<a '))
    const openTag = before.slice(openIdx)
    const wrapped =
      openIdx !== -1 &&
      openTag.length < 600 &&
      !openTag.includes('</Link>') &&
      !openTag.includes('</a>')
    if (wrapped) continue

    deadButtons.push(`${rel(file)}:${startLine}  ${m[0].slice(0, 70)}`)
  }
}

// ---------------------------------------------------------------- report
console.log(`routes declared: ${Object.keys(routes).length}`)
console.log(`routes registered in router: ${registered.size}`)
console.log(`ROUTES constants never registered: ${missingRoutes.length}`)
missingRoutes.forEach((m) => console.log('   ! ' + m))

console.log(`\nlink references checked: ${linkTargets.size} constants used`)
console.log(`broken link/navigate targets: ${badRefs.length}`)
badRefs.forEach((b) => console.log('   ! ' + b))

console.log(`\nbuttons without a handler: ${deadButtons.length}`)
deadButtons.forEach((b) => console.log('   ? ' + b))

if (missingRoutes.length || badRefs.length) process.exitCode = 1
