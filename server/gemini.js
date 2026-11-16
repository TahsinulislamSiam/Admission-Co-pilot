/**
 * Backend for the AI assistant. Keeps the OpenAI key on the server.
 * Run with:  npm run server   (port 3001; Vite proxies /api/assistant/chat to it)
 * (The OpenAI streaming proxy for VITE_ASSISTANT_MODE=live is server/index.js.)
 *
 * How answers are produced:
 *  1. ChatGPT gets ALL verified records (knowledge base + public + private
 *     universities) as context, so any phrasing in Bangla/English can match.
 *  2. Facts found in those records are used and cited with sources.
 *  3. Everything else is answered from general knowledge, marked as unverified.
 *  4. If OpenAI is unreachable -> keyword match on the knowledge base, else no_record.
 */
import 'dotenv/config'
import express from 'express'
import { knowledgeBase } from '../src/mocks/seed/assistant.js'
import { publicUniversities } from '../src/mocks/seed/publicUniversities.js'
import { privateUniversities } from '../src/mocks/seed/privateUniversities.js'

const PORT = process.env.PORT || 3001
const TIMEOUT_MS = 9000 // stay under the UI's 10s limit

// Provider: Gemini if GEMINI_API_KEY is set (free tier), otherwise OpenAI.
const GEMINI_KEY = process.env.GEMINI_API_KEY
// Tried in order; if one is overloaded/retired the next one answers.
const GEMINI_MODELS = (process.env.GEMINI_MODEL || 'gemini-flash-lite-latest,gemini-3.5-flash')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean)
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

if (!GEMINI_KEY && !process.env.OPENAI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in .env — add it and restart.')
  process.exit(1)
}
console.log(`AI provider: ${GEMINI_KEY ? `Gemini (${GEMINI_MODELS.join(' → ')})` : `OpenAI (${OPENAI_MODEL})`}`)

/** Ask the model; returns the raw JSON string it produced. */
async function askModel(system, message) {
  if (GEMINI_KEY) {
    let lastErr
    for (const model of GEMINI_MODELS) {
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
            signal: AbortSignal.timeout(Math.floor(TIMEOUT_MS / GEMINI_MODELS.length)),
          }
        )
        if (!r.ok) {
          const err = new Error(`Gemini ${model} ${r.status}: ${(await r.text()).slice(0, 200)}`)
          err.status = r.status
          throw err
        }
        const data = await r.json()
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') || ''
        if (text) return text
        throw new Error(`Gemini ${model} returned an empty answer`)
      } catch (e) {
        console.error(`Gemini ${model} failed:`, e.message)
        lastErr = e
      }
    }
    throw lastErr
  }

  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const c = await openai.chat.completions.create(
    {
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: message },
      ],
    },
    { timeout: TIMEOUT_MS }
  )
  return c.choices[0]?.message?.content || ''
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

// ---------- build the verified-records context once at boot ----------
const sourceById = new Map() // id -> [{label,url}]
const records = []

knowledgeBase.forEach((k, i) => {
  const id = `kb${i}`
  sourceById.set(id, k.sources)
  records.push(`[${id}] ${k.answer.en}\n${k.answer.bn}`)
})
for (const u of [...publicUniversities, ...privateUniversities]) {
  sourceById.set(u.id, [{ label: u.name, url: u.sourceUrl }])
  records.push(`[${u.id}] ${JSON.stringify(u)}`)
}
const CONTEXT = records.join('\n\n')

const SYSTEM = `You are the admission assistant for Bangladeshi HSC students. Today is ${new Date().toISOString().slice(0, 10)}.
You are given VERIFIED RECORDS, each tagged like [id].

Rules:
1. Always answer the question helpfully. Never refuse and never say you have no record.
2. If the verified records contain the answer, use them (they are the most accurate) and list their ids in "used",
   with "mode":"verified".
3. Otherwise answer from your general knowledge with "mode":"general" and "used":[]. For specific numbers/dates
   (fees, deadlines, seats) that are not in the records, give your best estimate, say it may be outdated, and
   suggest checking the official admission site.
4. Reply in the same language as the user's question (Bangla or English). Use short Markdown.

Return ONLY JSON: {"mode":"verified"|"general","answer":"...","used":["id",...]}

VERIFIED RECORDS:
${CONTEXT}`

const GENERAL_NOTE = {
  bn: '\n\n_এটি সাধারণ তথ্য, যাচাই করা রেকর্ড নয়। গুরুত্বপূর্ণ সিদ্ধান্তের আগে অফিসিয়াল সাইট দেখুন।_',
  en: '\n\n_This is general information, not a verified record. Please check official sites before important decisions._',
}

/** Offline fallback: old keyword rule on the knowledge base. */
const keywordRecord = (q) =>
  knowledgeBase.find((k) => k.keywords.some((kw) => q.includes(kw.toLowerCase())))

const app = express()
app.use(express.json({ limit: '10kb' }))

app.post('/api/assistant/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim().slice(0, 500)
  const lang = req.body?.lang === 'en' ? 'en' : 'bn'
  if (!message) return res.status(400).json({ message: 'emptyMessage' })

  try {
    const parsed = JSON.parse((await askModel(SYSTEM, message)) || '{}')
    const answer = String(parsed.answer || '').trim()

    if (!answer) return res.json(NO_RECORD)

    if (parsed.mode === 'general') {
      return res.json({
        status: 'ok',
        message: answer + (/[ঀ-৿]/.test(answer) ? GENERAL_NOTE.bn : GENERAL_NOTE.en),
        sources: [],
      })
    }

    // verified: attach sources of the records that were used (deduplicated by url)
    const seen = new Set()
    const sources = (Array.isArray(parsed.used) ? parsed.used : [])
      .flatMap((id) => sourceById.get(id) || [])
      .filter((s) => !seen.has(s.url) && seen.add(s.url))
    res.json({ status: 'ok', message: answer, sources })
  } catch (e) {
    console.error('AI error:', e.status, e.code || e.name, e.message)
    if (['APIConnectionTimeoutError', 'TimeoutError', 'AbortError'].includes(e.name)) {
      return res.status(504).json({ message: 'timeout' })
    }
    // AI provider unavailable (no credits, rate limit, outage…): serve a verified
    // record if the keywords match, otherwise be honest.
    const rec = keywordRecord(message.toLowerCase())
    if (rec) return res.json({ status: 'ok', message: rec.answer[lang], sources: rec.sources })
    // No record either: this is a service problem (e.g. billing), not "no
    // record exists" — report it as an error instead of a misleading answer.
    res.status(503).json({ message: 'assistantError' })
  }
})

app.listen(PORT, (err) => {
  if (err) {
    console.error(
      err.code === 'EADDRINUSE'
        ? `Port ${PORT} is already in use — another copy of the server is running. Stop it and retry.`
        : err
    )
    process.exit(1)
  }
  console.log(`Assistant API on http://localhost:${PORT}`)
})
