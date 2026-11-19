/**
 * Admission Copilot — token proxy for the AI assistant.
 *
 * Exists so the Gemini API key never ships to the browser. Dev-only by
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

// Must match the Vite proxy target (ASSISTANT_PORT in .env, default 8787).
const PORT = process.env.ASSISTANT_PORT || process.env.PORT || 8787
// Per-model budget, and a hard deadline shared by all fallbacks: the browser
// gives up after 30s in live mode (ASSISTANT_TIMEOUT_MS * 3), so stay under it.
const TIMEOUT_MS = Number(process.env.ASSISTANT_TIMEOUT_MS) || 20000
const DEADLINE_MS = Number(process.env.ASSISTANT_DEADLINE_MS) || 25000

// Provider: Google Gemini (free tier). This app no longer uses OpenAI.
const GEMINI_KEY = process.env.GEMINI_API_KEY
// Tried in order; if one is overloaded/retired the next one answers.
const GEMINI_MODELS = (
  process.env.GEMINI_MODEL || 'gemini-flash-lite-latest,gemini-3.5-flash'
)
  .split(',')
  // Tolerate stray characters from hand-edited .env lines (a leading `=`, quotes,
  // spaces) — they used to produce an invalid model name and a 400 from Gemini.
  .map((m) => m.trim().replace(/^=+/, '').replace(/^["']+|["']+$/g, '').trim())
  .filter(Boolean)
  .filter((m, i, all) => all.indexOf(m) === i)

if (!GEMINI_KEY) {
  console.error('Missing GEMINI_API_KEY in .env — add it and restart.')
  process.exit(1)
}
console.log(`AI provider: Gemini (${GEMINI_MODELS.join(' → ')})`)

/** Ask Gemini; returns the raw JSON string it produced. */
async function askModel(system, message) {
  let lastErr
  const deadline = Date.now() + DEADLINE_MS
  for (const model of GEMINI_MODELS) {
    const startedAt = Date.now()
    // Give each model only the time that is left, so one slow model cannot eat
    // the whole budget and leave the browser waiting.
    const budget = Math.min(TIMEOUT_MS, deadline - startedAt)
    if (budget < 1000) break
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(budget),
        }
      )
      if (!r.ok) {
        const err = new Error(`Gemini ${model} ${r.status}: ${(await r.text()).slice(0, 200)}`)
        err.status = r.status
        throw err
      }
      const data = await r.json()
      console.log(`Gemini ${model} answered in ${Date.now() - startedAt}ms`)
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') || ''
      if (text) return text
      throw new Error(`Gemini ${model} returned an empty answer`)
    } catch (e) {
      console.error(`Gemini ${model} failed after ${Date.now() - startedAt}ms:`, e.message)
      lastErr = e
    }
  }
  throw lastErr
}

const NO_RECORD = {
  status: 'no_record',
  message: {
    bn: 'দুঃখিত, এই বিষয়ে আমার কাছে **যাচাই করা কোনো রেকর্ড নেই।** অনুগ্রহ করে নিচের অফিসিয়াল পেজ দেখুন।',
    en: 'Sorry, I have **no verified record** on this topic. Please check the official pages below.',
  },
  sources: [
    { label: { bn: 'বাংলাদেশ শিক্ষা মন্ত্রণালয়', en: 'Ministry of Education, Bangladesh' }, url: 'https://www.moedu.gov.bd' },
    { label: { bn: 'UGC', en: 'UGC' }, url: 'https://www.ugc.university' },
  ],
}

// ---------- verified records, indexed for per-question selection ----------
// The whole dataset is ~117k chars. Sending all of it pushed every reply past
// 20s (and past the client timeout), so each question now gets the records that
// actually match it, in full — same data, same prompt, far less context.
const sourceById = new Map() // id -> [{label,url}]
const records = [] // { id, text, hay }
const KB_COUNT = knowledgeBase.length

knowledgeBase.forEach((k, i) => {
  const id = `kb${i}`
  sourceById.set(id, k.sources)
  records.push({
    id,
    text: `[${id}] ${k.answer.en}\n${k.answer.bn}`,
    hay: [k.answer.en, k.answer.bn, ...(k.keywords || [])].join(' ').toLowerCase(),
  })
})
for (const u of [...publicUniversities, ...privateUniversities]) {
  const label = typeof u.name === 'string' ? u.name : u.name?.en || u.id
  sourceById.set(u.id, [{ label, url: u.sourceUrl }])
  records.push({
    id: u.id,
    text: `[${u.id}] ${JSON.stringify(u)}`,
    hay: [
      u.id,
      u.name?.en,
      u.name?.bn,
      u.shortName?.en,
      u.shortName?.bn,
      u.city?.en,
      u.city?.bn,
      u.type,
      ...(u.units || []).map((x) => x.name?.en),
      ...(u.units || []).map((x) => x.name?.bn),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  })
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'how', 'what', 'when', 'which', 'who', 'why', 'does', 'did', 'are', 'was',
  'can', 'you', 'your', 'about', 'with', 'from', 'this', 'that', 'there', 'any', 'much', 'many',
  'koto', 'kotha', 'kivabe', 'ki', 'kii', 'na', 'ki?', 'holo', 'hobe', 'please', 'tell',
])

/** Question words used for the lookup (drops filler and very short tokens). */
const queryWords = (question) =>
  String(question)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))

/**
 * Pick the best-matching verified records for one question.
 * Falls back to the curated knowledge base when nothing matches, so a purely
 * general question is still grounded in the core facts (and stays small).
 */
function selectRecords(question, { max = 6, budget = 9000 } = {}) {
  const words = queryWords(question)
  const scored = records
    .map((r) => ({ r, score: words.reduce((n, w) => (r.hay.includes(w) ? n + 1 : n), 0) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const picked = []
  let size = 0
  for (const { r } of scored) {
    if (picked.length >= max) break
    if (size + r.text.length > budget && picked.length) continue
    picked.push(r)
    size += r.text.length
  }
  return picked.length ? picked : records.slice(0, KB_COUNT)
}

/** System prompt for one question: the rules plus only the selected records. */
const buildSystem = (selected) => `You are the admission assistant for Bangladeshi HSC students. Today is ${new Date().toISOString().slice(0, 10)}.
You are given VERIFIED RECORDS, each tagged like [id].

function rateLimit(req, res, next) {
  const key = req.ip || 'unknown'
  const now = Date.now()
  const entry = hits.get(key) || { count: 0, resetAt: now + WINDOW_MS }

Return ONLY JSON: {"mode":"verified"|"general","answer":"...","used":["id",...]}

VERIFIED RECORDS:
${selected.map((r) => r.text).join('\n\n')}`

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
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    keyConfigured: Boolean(process.env.GEMINI_API_KEY),
  })
})

/** Ask Gemini and turn its JSON into the reply payload the UI expects. */
async function buildReply(message) {
  const selected = selectRecords(message)
  console.log(
    `Records: ${selected.map((r) => r.id).join(',')} ` +
      `(${selected.reduce((n, r) => n + r.text.length, 0)} chars)`
  )
  const parsed = JSON.parse((await askModel(buildSystem(selected), message)) || '{}')
  const answer = String(parsed.answer || '').trim()

  if (!answer) return NO_RECORD

  if (parsed.mode === 'general') {
    return {
      status: 'ok',
      message: answer + (/[ঀ-৿]/.test(answer) ? GENERAL_NOTE.bn : GENERAL_NOTE.en),
      sources: [],
    }
  }

  // verified: attach sources of the records that were used (deduplicated by url)
  const seen = new Set()
  const sources = (Array.isArray(parsed.used) ? parsed.used : [])
    .flatMap((id) => sourceById.get(id) || [])
    .filter((s) => !seen.has(s.url) && seen.add(s.url))
  return { status: 'ok', message: answer, sources }
}

/** Plain text of a reply, in the language the client asked for. */
const replyText = (reply, lang) =>
  typeof reply.message === 'string'
    ? reply.message
    : reply.message?.[lang] || reply.message?.en || reply.message?.bn || ''

/**
 * Serve a reply as Server-Sent Events, the shape the browser's `streamMessage`
 * reads (`event: delta` / `sources` / `done`). Without this the streaming client
 * saw a plain JSON body, parsed zero frames and rendered an empty bubble.
 */
function sendSse(res, reply, lang) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  const text = replyText(reply, lang)

  if (text) send('delta', { text })
  send('sources', { sources: reply.sources || [] })
  send('done', { status: reply.status || 'ok' })
  res.end()
}

app.post('/api/assistant/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim().slice(0, 500)
  const lang = req.body?.lang === 'en' ? 'en' : 'bn'
  const wantsStream = Boolean(req.body?.stream)
  if (!message) return res.status(400).json({ message: 'emptyMessage' })

  try {
    const reply = await buildReply(message)
    return wantsStream ? sendSse(res, reply, lang) : res.json(reply)
  } catch (e) {
    console.error('AI error:', e.status, e.code || e.name, e.message)
    // AI provider unavailable or too slow (no credits, rate limit, outage…):
    // serve a verified record if the keywords match, otherwise be honest.
    const rec = keywordRecord(message.toLowerCase())
    if (rec) {
      const reply = { status: 'ok', message: rec.answer[lang], sources: rec.sources }
      return wantsStream ? sendSse(res, reply, lang) : res.json(reply)
    }
    if (['APIConnectionTimeoutError', 'TimeoutError', 'AbortError'].includes(e.name)) {
      return res.status(504).json({ message: 'timeout' })
    }
    // No record either: this is a service problem (e.g. billing), not "no
    // record exists" — report it as an error instead of a misleading answer.
    res.status(503).json({ message: 'assistantError' })
  }
})

const shutdown = () => server.close(() => process.exit(0))
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
