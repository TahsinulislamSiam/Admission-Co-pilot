/**
 * POST /api/assistant/chat — OpenAI-backed assistant endpoint.
 *
 * The browser never sees the API key: this server owns it and is the only
 * process that talks to OpenAI. Response shape matches the existing mock
 * contract so the UI needs no special case:
 *
 *   200 { status: 'ok' | 'no_record', message: { en, bn }, sources: [...] }
 *
 * Pass `{ stream: true }` to receive Server-Sent Events instead:
 *   event: delta   data: {"text": "..."}
 *   event: sources data: {"sources": [...]}
 *   event: done    data: {"status": "ok"}
 *   event: error   data: {"message": "..."}
 */
import OpenAI from 'openai'
import { buildSystemPrompt, knownSources } from './prompt.js'

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const MAX_HISTORY = 12 // keep the prompt bounded
const NO_RECORD = '[[NO_RECORD]]'

let client = null
function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error('missingApiKey')
    err.status = 503
    throw err
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
      timeout: 30_000,
      maxRetries: 1,
    })
  }
  return client
}

/** Keep only well-formed turns, cap the length, and drop the pending bubble. */
function cleanHistory(history = []) {
  return history
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content }))
}

/** Extract https links from a reply and keep only ones we consider official. */
function extractSources(text) {
  const known = knownSources()
  const byUrl = new Map(known.map((s) => [s.url.replace(/\/+$/, ''), s]))

  const urls = [...String(text).matchAll(/https?:\/\/[^\s)\]"'<>]+/g)].map((m) =>
    m[0].replace(/[.,;:]+$/, '')
  )

  const out = []
  for (const url of urls) {
    const hit = byUrl.get(url.replace(/\/+$/, ''))
    if (hit && !out.some((s) => s.url === hit.url)) out.push(hit)
  }
  return out
}

/** Strip the no-record marker and whitespace from a model reply. */
function tidy(text) {
  return String(text || '')
    .replaceAll(NO_RECORD, '')
    .trim()
}

const statusFor = (text) => (String(text).includes(NO_RECORD) ? 'no_record' : 'ok')

/** Map upstream failures to the app's error contract. */
function toHttpError(e) {
  const status = e?.status
  if (e?.message === 'missingApiKey') {
    return { code: 503, message: 'missingApiKey' }
  }
  if (status === 401 || status === 403) {
    return { code: 502, message: 'assistantAuthError' }
  }
  if (status === 429) return { code: 429, message: 'assistantRateLimited' }
  if (e?.name === 'AbortError' || /timeout/i.test(e?.message || '')) {
    return { code: 504, message: 'timeout' }
  }
  return { code: status && status >= 400 && status < 600 ? status : 502, message: 'assistantError' }
}

/** Non-streaming path: one complete reply. */
async function complete(messages, lang) {
  const res = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 800,
    messages: [{ role: 'system', content: buildSystemPrompt(lang) }, ...messages],
  })

  const text = res.choices?.[0]?.message?.content || ''
  return {
    status: statusFor(text),
    message: { en: tidy(text), bn: tidy(text) },
    sources: extractSources(text),
  }
}

/** Streaming path: relays token deltas as Server-Sent Events. */
async function stream(messages, lang, res) {
  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  let full = ''
  try {
    const upstream = await getClient().chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 800,
      stream: true,
      messages: [{ role: 'system', content: buildSystemPrompt(lang) }, ...messages],
    })

    for await (const chunk of upstream) {
      const delta = chunk.choices?.[0]?.delta?.content || ''
      if (!delta) continue
      full += delta
      // Hold back the marker so it never renders mid-stream
      send('delta', { text: delta.replaceAll(NO_RECORD, '') })
    }

    send('sources', { sources: extractSources(full) })
    send('done', { status: statusFor(full) })
    res.end()
  } catch (e) {
    const mapped = toHttpError(e)
    // If nothing was sent yet, surface a real HTTP status
    if (!full && !res.headersSent) {
      res.status(mapped.code).json({ message: mapped.message })
    } else {
      send('error', { message: mapped.message })
      res.end()
    }
  }
}

/** Express handler for POST /api/assistant/chat */
export async function chatHandler(req, res) {
  const body = req.body || {}
  const message = String(body.message || '').trim()
  const lang = body.lang === 'en' ? 'en' : 'bn'

  if (!message) {
    return res.status(400).json({ message: 'messageRequired' })
  }
  if (message.length > 2000) {
    return res.status(413).json({ message: 'messageTooLong' })
  }

  const messages = [...cleanHistory(body.history), { role: 'user', content: message }]

  try {
    if (body.stream) return await stream(messages, lang, res)
    return res.json(await complete(messages, lang))
  } catch (e) {
    const mapped = toHttpError(e)
    return res.status(mapped.code).json({ message: mapped.message })
  }
}

/** Express handler for GET /api/assistant/suggestions */
export function suggestionsHandler(_req, res) {
  res.json({
    questions: [
      { bn: 'ঢাকা বিশ্ববিদ্যালয়ের ক ইউনিটে কত আসন?', en: 'How many seats are in DU A Unit?' },
      { bn: 'বুয়েটে ভর্তির যোগ্যতা কী?', en: 'What is the eligibility for BUET?' },
      { bn: 'মেডিকেল ভর্তি পরীক্ষার নম্বর কত?', en: 'What is the medical admission marking?' },
      { bn: 'কোন প্রাইভেট ইউনিভার্সিটির টিউশন ফি কত?', en: 'What are private university tuition fees?' },
    ],
  })
}
