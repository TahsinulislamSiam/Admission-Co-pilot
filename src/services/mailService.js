import { api, normalizedError } from '@/lib/axios'

/** In-app mail API (Postgres `messages`) — shared by students and admins. */
export const mailService = {
  async inbox() {
    try {
      const { data } = await api.get('/mail/inbox')
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async sent() {
    try {
      const { data } = await api.get('/mail/sent')
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async send(payload) {
    try {
      const { data } = await api.post('/mail', payload)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async markRead(id) {
    try {
      const { data } = await api.post(`/mail/${id}/read`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async unreadCount() {
    try {
      const { data } = await api.get('/mail/unread')
      return data.total ?? 0
    } catch (e) {
      throw normalizedError(e)
    }
  },

  /** Recipients the caller may write to (students get admins, admins everyone). */
  async contacts() {
    try {
      const { data } = await api.get('/mail/contacts')
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
