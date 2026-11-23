import { api, normalizedError } from '@/lib/axios'

/** Admin API (AI-1, record management, question review). */
export const adminService = {
  // --- overview ---
  async getOverview() {
    try {
      const { data } = await api.get('/admin/overview')
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  // --- circulars ---
  /**
   * Upload a circular PDF + metadata. The mock backend simulates the
   * extraction pipeline; progress steps are tracked in the UI.
   */
  async uploadCircular({ file, universityId, universityName, title }) {
    try {
      const { data } = await api.post(
        '/admin/circulars',
        {
          universityId,
          universityName,
          title,
          fileName: file?.name,
          fileSize: file?.size,
        },
        { timeout: 30000 }
      )
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async listCirculars() {
    try {
      const { data } = await api.get('/admin/circulars')
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async getCircular(id) {
    try {
      const { data } = await api.get(`/admin/circulars/${id}`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async saveCircularDraft(id, payload) {
    try {
      const { data } = await api.patch(`/admin/circulars/${id}`, payload)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async approveCircular(id) {
    try {
      const { data } = await api.post(`/admin/circulars/${id}/approve`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async rejectCircular(id, reason) {
    try {
      const { data } = await api.post(`/admin/circulars/${id}/reject`, { reason })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  // --- question review ---
  async listQuestions(status) {
    try {
      const { data } = await api.get('/admin/questions', {
        params: status ? { status } : {},
      })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async updateQuestion(id, payload) {
    try {
      const { data } = await api.patch(`/admin/questions/${id}`, payload)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async approveQuestion(id) {
    try {
      const { data } = await api.post(`/admin/questions/${id}/approve`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async rejectQuestion(id, reason) {
    try {
      const { data } = await api.post(`/admin/questions/${id}/reject`, { reason })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  // --- university records ---
  async createUniversity(payload) {
    try {
      const { data } = await api.post('/admin/universities', payload)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async updateUniversity(id, payload) {
    try {
      const { data } = await api.patch(`/admin/universities/${id}`, payload)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async deleteUniversity(id) {
    try {
      const { data } = await api.delete(`/admin/universities/${id}`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  // --- users ---
  async listUsers(q = '') {
    try {
      const { data } = await api.get('/admin/users', { params: q ? { q } : undefined })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async getUser(id) {
    try {
      const { data } = await api.get(`/admin/users/${id}`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async deleteUser(id) {
    try {
      const { data } = await api.delete(`/admin/users/${id}`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  // --- videos ---
  async listVideos(subject = '') {
    try {
      const { data } = await api.get('/videos', { params: subject ? { subject } : undefined })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async addVideo(payload) {
    try {
      const { data } = await api.post('/admin/videos', payload)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async deleteVideo(id) {
    try {
      const { data } = await api.delete(`/admin/videos/${id}`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  // --- mail (in-app inbox) ---
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

  async sendMail(payload) {
    try {
      const { data } = await api.post('/mail', payload)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async markMailRead(id) {
    try {
      const { data } = await api.post(`/mail/${id}/read`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async unreadMailCount() {
    try {
      const { data } = await api.get('/mail/unread')
      return data.total ?? 0
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
