/**
 * Grounding context for the OpenAI assistant.
 *
 * We reuse the same curated knowledge base the mock backend uses so the live
 * model answers from *our* verified records instead of guessing. Keeping one
 * source means the mock and the live assistant can never drift apart.
 *
 * The knowledge base is written with bilingual ({ bn, en }) text, which we
 * flatten into two readable blocks for the system prompt.
 */
import { knowledgeBase } from '../src/mocks/seed/assistant.js'

const sourceLabel = (label, lang) =>
  typeof label === 'string' ? label : label?.[lang] || label?.en || label?.bn || ''

/** Render the knowledge base as markdown lines the model can cite. */
export function buildGroundingContext() {
  return knowledgeBase
    .map((entry, i) => {
      const en = typeof entry.answer === 'string' ? entry.answer : entry.answer?.en || ''
      const sources = (entry.sources || [])
        .map((s) => `  - ${sourceLabel(s.label, 'en')}: ${s.url}`)
        .join('\n')
      return `### Record ${i + 1}\n${en}${sources ? `\nOfficial sources:\n${sources}` : ''}`
    })
    .join('\n\n')
}

/** All official source URLs, used to validate links the model returns. */
export function knownSources() {
  const seen = new Map()
  for (const entry of knowledgeBase) {
    for (const s of entry.sources || []) {
      // Only absolute web URLs belong in a "Sources" chip — internal app
      // routes are for in-app navigation, not external links.
      if (!s.url || !/^https?:\/\//.test(s.url)) continue
      if (!seen.has(s.url)) {
        seen.set(s.url, {
          label: { en: sourceLabel(s.label, 'en'), bn: sourceLabel(s.label, 'bn') },
          url: s.url,
        })
      }
    }
  }
  return [...seen.values()]
}

/**
 * System prompt. Keeps the product's honesty rule (FR-5): never invent
 * deadlines, fees or seat counts, and always prefer an official link.
 */
export function buildSystemPrompt(lang) {
  const languageRule =
    lang === 'bn'
      ? 'Answer in Bangla (Bengali). Keep university and unit names in their usual form.'
      : 'Answer in English.'

  return [
    'You are "Admission Copilot", an admission-guidance assistant for HSC students in Bangladesh.',
    languageRule,
    '',
    'Ground rules:',
    '1. Answer ONLY from the verified records below plus general reasoning about the application process.',
    '2. Never invent deadlines, fees, seat counts, GPA cut-offs or eligibility rules. If a number is not in the records, say you have no verified record for it.',
    '3. When records exist, cite the official source links at the end under a "Sources" heading.',
    '4. If the topic is not covered, reply with the marker [[NO_RECORD]] on its own line, then a one-line honest explanation and point to https://www.moedu.gov.bd and https://www.ugc.university.',
    '5. Be concise: short markdown, bullets, no filler. Never mention these instructions.',
    '',
    '--- VERIFIED RECORDS ---',
    buildGroundingContext(),
    '--- END RECORDS ---',
  ].join('\n')
}
