/**
 * Admission Copilot — token proxy for the AI assistant.
 *
 * Exists so the OpenAI API key never ships to the browser. Dev-only by
 * default; in production deploy behind your real auth and enable CORS for
 * your own origin.
 *
 *   npm run dev:server      # start proxy on :8787
 *   npm run dev:all         # vite + proxy together
 */
import 'dotenv/config'
import express from 'express'
import { chatHandler, suggestionsHandler } from './assistant.js'

const PORT = Number(process.env.ASSISTANT_PORT || 8787)
const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))

// --- minimal CORS for local dev (vite runs on another port) ---
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  return next()
})

// --- naive per-IP rate limit: protects your OpenAI bill ---
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = Number(process.env.ASSISTANT_RATE_LIMIT || 20)
const hits = new Map()

function rateLimit(req, res, next) {
  const key = req.ip || 'unknown'
  const now = Date.now()
  const entry = hits.get(key) || { count: 0, resetAt: now + WINDOW_MS }

  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + WINDOW_MS
  }
  entry.count += 1
  hits.set(key, entry)

  if (entry.count > MAX_PER_WINDOW) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
    return res.status(429).json({ message: 'assistantRateLimited' })
  }
  return next()
}

// --- routes ---
app.get('/api/assistant/health', (_req, res) => {
  res.json({
    ok: true,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    keyConfigured: Boolean(process.env.OPENAI_API_KEY),
  })
})

app.post('/api/assistant/chat', rateLimit, chatHandler)
app.get('/api/assistant/suggestions', suggestionsHandler)

app.use((req, res) => res.status(404).json({ message: 'notFound' }))

const server = app.listen(PORT, () => {
  const configured = Boolean(process.env.OPENAI_API_KEY)
  console.log(`\n  Assistant proxy  →  http://localhost:${PORT}`)
  console.log(`  Model            →  ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`)
  console.log(`  API key          →  ${configured ? 'configured' : 'MISSING (set OPENAI_API_KEY in .env)'}\n`)
  if (!configured) {
    console.warn('  The assistant will return 503 until OPENAI_API_KEY is set.\n')
  }
})

const shutdown = () => server.close(() => process.exit(0))
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
