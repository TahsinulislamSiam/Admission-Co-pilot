import { api, normalizedError } from '@/lib/axios'

/** Newspaper section: national + international headlines from public RSS feeds. */
export const newsService = {
  async list(scope = 'all', limit = 24) {
    try {
      const { data } = await api.get('/news', { params: { scope, limit } })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async papers() {
    try {
      const { data } = await api.get('/news/papers')
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
