import { api, normalizedError } from '@/lib/axios'

/** Recommendations API (AI-4). Server returns 422 when the profile is incomplete. */
export const recommendationService = {
  async getRecommendations() {
    try {
      const { data } = await api.get('/recommendations')
      return data.items
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
