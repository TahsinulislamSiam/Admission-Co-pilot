/**
 * POST /api/assistant/chat — Gemini-backed assistant endpoint.
 *
 * The browser never sees the API key: this server owns it and is the only
 * process that talks to Google Gemini. Response shape matches the existing mock
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
import { buildSystemPrompt, knownSources } from './prompt.js'

// GEMINI_MODEL may hold a comma-separated list ("a,b"): tried in order, so one
// overloaded or retired model does not take the assistant down. A single name
// works exactly as before.
const MODELS = (process.env.GEMINI_MODEL || 'gemini-flash-lite-latest')
  .split(',')
  .map((m) => m.trim().replace(/^=+/, '').replace(/^["']+|["']+$/g, '').trim())
  .filter(Boolean)
  .filter((m, i, all) => all.indexOf(m) === i)
const BASE_URL =
  process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'
const MAX_HISTORY = 12 // keep the prompt bounded
const NO_RECORD = '[[NO_RECORD]]'

function requireKey() {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error('missingApiKey')
    err.status = 503
    throw err
  }
  return process.env.GEMINI_API_KEY
}

/** Tidy history into Gemini `contents` ({ role: 'user'|'model', parts }). */
function toContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

/**
 * One Gemini call, trying each configured model in order.
 * Returns the successful Response (body not yet read) or throws the last error.
 */
async function generate({ system, contents, stream = false }) {
  const key = requireKey()
  const method = stream ? 'streamGenerateContent' : 'generateContent'
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
  })

  let lastErr
  for (const model of MODELS) {
    const url = `${BASE_URL}/models/${model}:${method}` + (stream ? '?alt=sse' : '')
    let res
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body,
        signal: AbortSignal.timeout(30_000),
      })
    } catch (e) {
      lastErr = e
      continue
    }
    if (res.ok) return res
    const err = new Error(`Gemini ${model} ${res.status}: ${(await res.text()).slice(0, 200)}`)
    err.status = res.status
    lastErr = err
    // 401/403/429 are about the key or the quota, not this model — stop trying.
    if ([401, 403, 429].includes(res.status)) break
  }
  throw lastErr
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
  const res = await generate({
    system: buildSystemPrompt(lang),
    contents: toContents(messages),
  })
  const data = await res.json()
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') || ''
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
    const upstream = await generate({
      system: buildSystemPrompt(lang),
      contents: toContents(messages),
      stream: true,
    })

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    // Markers can be split across chunks ("[[NO" + "_RECORD]]"), so the tail of
    // every chunk that could still become one is held back instead of emitted.
    let pending = ''
    const heldBack = (text) => {
      for (let k = Math.min(text.length, NO_RECORD.length - 1); k > 0; k -= 1) {
        if (NO_RECORD.startsWith(text.slice(-k))) return k
      }
      return 0
    }
    const emit = (text, final = false) => {
      pending += text
      const cut = final ? pending.length : pending.length - heldBack(pending)
      const chunk = pending.slice(0, cut).replaceAll(NO_RECORD, '')
      pending = pending.slice(cut)
      if (chunk) send('delta', { text: chunk })
    }

    // Parse the SSE stream and relay each text chunk as a delta. Gemini sends
    // frames separated by CRLF CRLF (`\r\n\r\n`), so splitting on `\n\n` alone
    // produced zero frames and the UI rendered an empty bubble.
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() || ''
      for (const evt of events) {
        for (const line of evt.split(/\r?\n/)) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          let chunk
          try {
            chunk = JSON.parse(payload)
          } catch {
            continue
          }
          const delta =
            chunk.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') || ''
          if (!delta) continue
          full += delta
          emit(delta)
        }
      }
    }
    emit('', true)

    send('sources', { sources: extractSources(full.replaceAll(NO_RECORD, '')) })
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
