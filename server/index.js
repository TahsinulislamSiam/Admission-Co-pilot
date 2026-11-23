/**
 * Admission Copilot — API server.
 *
 * Exists so the Gemini API key and the Postgres credentials never ship to the
 * browser. Started by `npm run dev:server`, or together with Vite through
 * `npm run dev:all` (port from ASSISTANT_PORT, default 8787).
 *
 *   GET  /api/health               app + database status
 *   GET  /api/assistant/health     assistant status (kept for older clients)
 *   GET  /api/assistant/suggestions  starter questions
 *   POST /api/assistant/chat       ask the assistant (JSON or SSE when stream)
 *   GET  /api/db/health            Postgres connectivity check
 *
 * AI logic lives in ./assistant.js, the database in ./db.js — this file only
 * wires them to HTTP.
 */
import 'dotenv/config'
import express from 'express'
import { chatHandler, suggestionsHandler } from './assistant.js'
import { healthCheck, isConfigured, close as closeDb } from './db.js'
import { hasDatabase } from './db/index.js'
import apiRouter from './routes/api.js'

const PORT = Number(process.env.ASSISTANT_PORT || process.env.PORT || 8787)
const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))

// --- CORS: the Vite dev server calls this on a different port ---
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  } else if (origin) {
    // Unknown origin: no CORS headers, the browser blocks the response.
    res.setHeader('Vary', 'Origin')
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  return next()
})

// --- simple per-IP rate limit, enough to stop runaway chat loops ---
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = Number(process.env.ASSISTANT_RATE_LIMIT) || 20
const hits = new Map()

function rateLimit(req, res, next) {
  const key = req.ip || 'unknown'
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return next()
  }
  if (entry.count >= MAX_PER_WINDOW) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
    return res.status(429).json({ message: 'assistantRateLimited' })
  }
  entry.count += 1
  return next()
}

/** Assistant provider status, without leaking the key. */
const assistantStatus = () => ({
  ok: true,
  provider: 'gemini',
  model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
  keyConfigured: Boolean(process.env.GEMINI_API_KEY),
})

// --- routes ---
app.get('/api/health', async (_req, res) => {
  const database = await healthCheck()
  res.status(database.ok ? 200 : 503).json({ ok: database.ok, assistant: assistantStatus(), database })
})

app.get('/api/assistant/health', (_req, res) => {
  res.json({ ...assistantStatus(), databaseConfigured: isConfigured() })
})

app.get('/api/assistant/suggestions', suggestionsHandler)
app.post('/api/assistant/chat', rateLimit, chatHandler)

app.get('/api/db/health', async (_req, res) => {
  const database = await healthCheck()
  res.status(database.ok ? 200 : 503).json(database)
})

// --- accounts, universities, videos and mail (Postgres) ---
if (hasDatabase) {
  app.use('/api', apiRouter)
} else {
  app.use('/api', (req, res, next) =>
    req.path.startsWith('/assistant') || req.path === '/health' || req.path === '/db/health'
      ? next()
      : res.status(503).json({ message: 'databaseNotConfigured' })
  )
}

// 404 for anything else, as JSON so the UI's error handling can read it.
app.use((_req, res) => res.status(404).json({ message: 'notFound' }))

/**
 * Last-resort error handler (after every route): malformed JSON and unexpected
 * failures answer with a code, never a stack trace or internals.
 */
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed' || err?.status === 400) {
    return res.status(400).json({ message: 'invalidJson' })
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'payloadTooLarge' })
  }
  console.error('Unhandled error:', err?.message)
  return res.status(500).json({ message: 'serverError' })
})

const server = app.listen(PORT, (err) => {
  if (err) {
    console.error(
      err.code === 'EADDRINUSE'
        ? `Port ${PORT} is already in use — another copy of the server is running. Stop it and retry.`
        : err
    )
    process.exit(1)
  }
  console.log(`Assistant API on http://localhost:${PORT}`)
  console.log(`AI provider: Gemini (${process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'})`)
  console.log(
    isConfigured()
      ? 'Postgres: configured (DATABASE_URL) — run `npm run db:check` to test'
      : 'Postgres: not configured — set DATABASE_URL in .env'
  )
})

const shutdown = () => {
  server.close(async () => {
    await closeDb().catch(() => {})
    process.exit(0)
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
