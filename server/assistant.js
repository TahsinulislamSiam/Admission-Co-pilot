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
import { knowledgeBase } from '../src/mocks/seed/assistant.js'

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

// The browser gives up at 30s (ASSISTANT_TIMEOUT_MS * 3 in
// src/lib/constants.js). Two models, one retry each, 30s per call added up to
// 43s of waiting and then a timeout in the UI, so the whole lookup now shares
// one deadline and answers from the local records before the browser quits.
const ATTEMPT_TIMEOUT_MS = Number(process.env.ASSISTANT_TIMEOUT_MS) || 12_000
const DEADLINE_MS = Number(process.env.ASSISTANT_DEADLINE_MS) || 22_000

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
  const deadline = Date.now() + DEADLINE_MS
  for (const model of MODELS) {
    const url = `${BASE_URL}/models/${model}:${method}` + (stream ? '?alt=sse' : '')
    // Transient failures (5xx, dropped connection) get one more try on the same
    // model: Gemini returns 500/503 "model overloaded" in short bursts.
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      // Only as much time as is left, so one slow model cannot use the budget
      // that the next one needs (or outlive the browser's timeout).
      const budget = Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now())
      if (budget < 1500) {
        lastErr = lastErr || new Error('Gemini deadline reached')
        break
      }
      let res
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body,
          signal: AbortSignal.timeout(budget),
        })
      } catch (e) {
        lastErr = e
        if (attempt === 2 || Date.now() >= deadline) break
        await new Promise((r) => setTimeout(r, 400 * attempt))
        continue
      }
      if (res.ok) return res
      const detail = (await res.text()).slice(0, 300)
      const err = new Error(`Gemini ${model} ${res.status}: ${detail}`)
      err.status = res.status
      lastErr = err
      // 401/403/429 are about the key or the quota, not this model — stop trying.
      if ([401, 403, 429].includes(res.status)) break
      // 5xx / 400-on-one-model: retry once, then move on to the next model.
      if (attempt === 1 && res.status >= 500) {
        await new Promise((r) => setTimeout(r, 400))
        continue
      }
      break
    }
    if ([401, 403, 429].includes(lastErr?.status)) break
  }
  // One readable line per failure, with the likely cause first.
  const msg = String(lastErr?.message || lastErr || '')
  const why =
    lastErr?.status === 429
      ? 'quota/rate limit reached'
      : [401, 403].includes(lastErr?.status) || /API[_ ]?key/i.test(msg)
        ? 'API key rejected'
        : lastErr?.name === 'TimeoutError'
          ? 'timed out'
          : 'provider error'
  console.warn(`Gemini failed (${why}): ${msg.slice(0, 200)}`)
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

/**
 * Degraded answer built from the local verified knowledge base.
 *
 * When Gemini is unreachable, out of quota (429) or the key stops working, the
 * assistant still answers from `src/mocks/seed/assistant.js` — the same records
 * the mock backend uses — instead of failing the whole chat. Nothing is made up:
 * if no record matches, this returns null and the caller reports the real error.
 */
function fallbackAnswer(question) {
  const q = String(question || '').toLowerCase()
  if (!q) return null

  let best = null
  let bestScore = 0
  for (const entry of knowledgeBase) {
    const score = (entry.keywords || []).reduce(
      (n, kw) => (kw && q.includes(String(kw).toLowerCase()) ? n + String(kw).length : n),
      0
    )
    if (score > bestScore) {
      best = entry
      bestScore = score
    }
  }
  if (!best) return null
  return {
    status: 'ok',
    degraded: true,
    message: { en: best.answer.en, bn: best.answer.bn },
    sources: best.sources || [],
  }
}

/** Last user turn of a message list. */
const lastUserText = (messages) =>
  [...messages].reverse().find((m) => m.role === 'user')?.content || ''

/**
 * Greetings and thanks need no lookup at all.
 *
 * Without this, "hello" reached the model, matched no verified record and came
 * back as the amber "no verified record" card — a bad first impression. These
 * replies are instant and cost no quota.
 */
const GREETING =
  /^(hi+|hey+|hello+|helo|hlw|yo|salam|salaam|assalamu?\s*alaikum|আসসালামু\s*আলাইকুম|সালাম|হ্যালো|হাই|কেমন\s*আছেন?|good\s*(morning|afternoon|evening|day)|শুভ\s*(সকাল|সন্ধ্যা))[\s!.,।?…]*$/iu
const THANKS = /^(thanks?|thank\s*you|thx|ok(ay)?|okay|ধন্যবাদ|থ্যাংক(স|স্)|ঠিক\s*আছে|আচ্ছা)[\s!.,।?…]*$/iu

const LOCAL_REPLIES = {
  greeting: {
    status: 'ok',
    local: true,
    message: {
      en: "Hello! I'm **Admission Copilot**. Ask me about university admission in Bangladesh — units and seat counts, eligibility, application deadlines, fees, or exam patterns. I answer from verified records and link the official source.",
      bn: 'হ্যালো! আমি **Admission Copilot**। বাংলাদেশের বিশ্ববিদ্যালয় ভর্তি নিয়ে প্রশ্ন করুন — ইউনিট ও আসন সংখ্যা, যোগ্যতা, আবেদনের সময়, ফি বা পরীক্ষার ধরন। আমি যাচাই করা রেকর্ড থেকে উত্তর দিই এবং অফিসিয়াল সোর্সের লিংক দিই।',
    },
    sources: [],
  },
  thanks: {
    status: 'ok',
    local: true,
    message: {
      en: 'You are welcome! Ask me anything else about admission — I am here to help.',
      bn: 'আপনাকে স্বাগতম! ভর্তি নিয়ে আরও কিছু জানতে চাইলে প্রশ্ন করুন — আমি সাহায্য করব।',
    },
    sources: [],
  },
}

/** Instant reply for a message that is only a greeting or a thank-you. */
function smallTalk(question) {
  const q = String(question || '').trim()
  if (!q || q.length > 40) return null
  if (GREETING.test(q)) return LOCAL_REPLIES.greeting
  if (THANKS.test(q)) return LOCAL_REPLIES.thanks
  return null
}

/**
 * Nothing local matches either: answer with the honesty card the UI already
 * renders for "no verified record", instead of a red error. The real cause is
 * logged, so a broken key or an exhausted quota stays visible in the console.
 */
const noRecordFallback = () => ({
  status: 'no_record',
  degraded: true,
  message: {
    bn: 'দুঃখিত, এই বিষয়ে আমার কাছে **যাচাই করা কোনো রেকর্ড নেই।** অনুগ্রহ করে নিচের অফিসিয়াল পেজ দেখুন।',
    en: 'Sorry, I have **no verified record** on this topic. Please check the official pages below.',
  },
  sources: [
    { label: { bn: 'শিক্ষা মন্ত্রণালয়', en: 'Ministry of Education' }, url: 'https://www.moedu.gov.bd' },
    { label: { bn: 'UGC', en: 'UGC' }, url: 'https://www.ugc.university' },
  ],
})

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

/** Non-streaming path: one complete reply (greeting, Gemini, else local). */
async function complete(messages, lang) {
  const quick = smallTalk(lastUserText(messages))
  if (quick) return quick
  try {
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
  } catch (e) {
    const local = fallbackAnswer(lastUserText(messages))
    if (local) {
      console.warn(`Gemini unavailable (${e.status || e.name}: ${e.message.slice(0, 120)}) — answered from the local records`)
      return local
    }
    console.warn(`Gemini unavailable (${e.status || e.name}) and no local record matched — no_record`)
    return noRecordFallback()
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

  // Greetings and thanks never need the model.
  const quick = smallTalk(lastUserText(messages))
  if (quick) {
    send('delta', { text: quick.message[lang] || quick.message.bn })
    send('sources', { sources: quick.sources })
    send('done', { status: quick.status })
    return res.end()
  }

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
    // Provider down or out of quota: answer from the local records if possible,
    // so the chat keeps working instead of showing an error card.
    const local = fallbackAnswer(lastUserText(messages))
    const reply = local || noRecordFallback()
    console.warn(
      `Gemini unavailable (${e.status || e.name}) — streaming ${local ? 'the local records' : 'the no-record card'}`
    )
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders?.()
    }
    send('delta', { text: reply.message[lang] || reply.message.bn })
    send('sources', { sources: reply.sources })
    send('done', { status: reply.status })
    return res.end()
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
