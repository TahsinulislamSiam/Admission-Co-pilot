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
}
