import { api, normalizedError } from '@/lib/axios'

/** University records API (FR-2, FR-3, FR-4). */
export const universityService = {
  async listPublic({ includeUnpublished = false } = {}) {
    try {
      const { data } = await api.get('/universities/public', {
        params: includeUnpublished ? { includeUnpublished: true } : {},
      })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async listPrivate({ includeUnpublished = false } = {}) {
    try {
      const { data } = await api.get('/universities/private', {
        params: includeUnpublished ? { includeUnpublished: true } : {},
      })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async getPublic(id) {
    try {
      const { data } = await api.get(`/universities/public/${id}`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async getPrivate(id) {
    try {
      const { data } = await api.get(`/universities/private/${id}`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
