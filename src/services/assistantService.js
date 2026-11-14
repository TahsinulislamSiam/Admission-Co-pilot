import { api, normalizedError } from '@/lib/axios'
import { ASSISTANT_TIMEOUT_MS } from '@/lib/constants'

/** True when chats should go to the real OpenAI-backed proxy (see server/). */
export const isLiveAssistant = () => import.meta.env.VITE_ASSISTANT_MODE === 'live'

/**
 * AI Assistant API (AI-2, AI-3). Enforces the NFR-1 10-second timeout —
 * the mock backend simulates a slow answer when the question contains "timeout".
 */
export const assistantService = {
  async sendMessage({ message, lang, history }) {
    try {
      const { data } = await api.post(
        '/assistant/chat',
        { message, lang, history },
        { timeout: ASSISTANT_TIMEOUT_MS }
      )
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  /**
   * Streamed variant of `sendMessage` (live mode only).
   *
   * Server-Sent Events are read manually with fetch instead of axios/EventSource
   * because the request needs a POST body and an Authorization header.
   *
   * @param {object}   args
   * @param {string}   args.message
   * @param {'bn'|'en'} args.lang
   * @param {Array}    [args.history]  prior turns: [{ role, content }]
   * @param {(text: string) => void} [args.onDelta]  called with each token chunk
   * @param {AbortSignal} [args.signal]
   * @returns {Promise<{status: string, text: string, sources: Array}>}
   */
  async streamMessage({ message, lang, history = [], onDelta, signal }) {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort('timeout'), ASSISTANT_TIMEOUT_MS * 3)
    signal?.addEventListener('abort', () => controller.abort('client'))

    let res
    try {
      res = await fetch(`${base}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, lang, history, stream: true }),
        signal: controller.signal,
      })
    } catch (e) {
      clearTimeout(timer)
      throw { status: 0, message: e?.message === 'timeout' ? 'timeout' : 'networkError' }
    }

    if (!res.ok || !res.body) {
      clearTimeout(timer)
      let payload = {}
      try {
        payload = await res.json()
      } catch {
        /* non-JSON error body */
      }
      throw { status: res.status, message: payload.message || 'assistantError' }
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let text = ''
    let status = 'ok'
    let sources = []

    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE frames are separated by a blank line
        const frames = buffer.split('\n\n')
        buffer = frames.pop() || ''

        for (const frame of frames) {
          const eventLine = frame.split('\n').find((l) => l.startsWith('event:'))
          const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
          if (!dataLine) continue
          const event = eventLine ? eventLine.slice(6).trim() : 'message'

          let payload
          try {
            payload = JSON.parse(dataLine.slice(5).trim())
          } catch {
            continue
          }

          if (event === 'delta' && payload.text) {
            text += payload.text
            onDelta?.(payload.text)
          } else if (event === 'sources') {
            sources = payload.sources || []
          } else if (event === 'done') {
            status = payload.status || 'ok'
          } else if (event === 'error') {
            throw { status: 502, message: payload.message || 'assistantError' }
          }
        }
      }
    } finally {
      clearTimeout(timer)
      reader.releaseLock?.()
    }

    return { status, text, sources }
  },

  async getSuggestions() {
    try {
      const { data } = await api.get('/assistant/suggestions')
      return data.questions || []
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
