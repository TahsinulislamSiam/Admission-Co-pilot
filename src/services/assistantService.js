import { api, normalizedError } from '@/lib/axios'
import { ASSISTANT_TIMEOUT_MS } from '@/lib/constants'

/**
 * AI Assistant API (AI-2, AI-3). Enforces the NFR-1 10-second timeout —
 * the mock backend simulates a slow answer when the question contains "timeout".
 */
export const assistantService = {
  async sendMessage({ message, lang }) {
    try {
      const { data } = await api.post(
        '/assistant/chat',
        { message, lang },
        { timeout: ASSISTANT_TIMEOUT_MS }
      )
      return data
    } catch (e) {
      throw normalizedError(e)
    }
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
