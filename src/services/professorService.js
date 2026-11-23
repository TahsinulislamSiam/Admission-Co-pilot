import { api, normalizedError } from '@/lib/axios'

/** University faculty directory (professors) — read for everyone, write for admins. */
export const professorService = {
  async list(q = '') {
    try {
      const { data } = await api.get('/professors', { params: q ? { q } : undefined })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async create(payload) {
    try {
      const { data } = await api.post('/admin/professors', payload)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async remove(id) {
    try {
      const { data } = await api.delete(`/admin/professors/${id}`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
