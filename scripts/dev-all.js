/**
 * Starts the assistant proxy and the Vite dev server together.
 *
 * Cross-platform on purpose (no `concurrently` dependency): spawns both
 * children, prefixes their output, and tears both down on Ctrl+C.
 *
 *   npm run dev:all
 */
import { spawn } from 'node:child_process'

const children = []

function run(name, command, args, color) {
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: process.env,
  })
  children.push(child)

  const prefix = `\x1b[${color}m[${name}]\x1b[0m `
  const pipe = (stream, target) => {
    let buffer = ''
    stream.setEncoding('utf8')
    stream.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) target.write(prefix + line + '\n')
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${prefix}exited with code ${code}`)
    }
  })
  return child
}

function shutdown(signal) {
  for (const child of children) {
    if (!child.killed) child.kill(signal === 'SIGINT' ? 'SIGINT' : 'SIGTERM')
  }
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

run('server', 'node', ['server/index.js'], '36')
run('vite', 'npx', ['vite'], '32')
