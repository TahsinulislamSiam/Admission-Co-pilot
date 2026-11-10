import { api, normalizedError } from '@/lib/axios'

/** Mistake analysis / dashboard analytics API (AI-5..AI-7, FR-8). */
export const analysisService = {
  /** Aggregated dashboard analytics for the signed-in student. */
  async getDashboard() {
    try {
      const { data } = await api.get('/users/me/analytics')
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  /** Step-by-step Bangla explanation for one question (used by "Explain in Bangla"). */
  async getExplanation(questionId) {
    try {
      const { data } = await api.get(`/questions/${questionId}/explanation`)
      return data.explanation
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
