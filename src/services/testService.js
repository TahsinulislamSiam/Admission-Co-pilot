import { api, normalizedError } from '@/lib/axios'

/** Mock test API (FR-6, FR-7). */
export const testService = {
  async list() {
    try {
      const { data } = await api.get('/tests')
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async get(id) {
    try {
      const { data } = await api.get(`/tests/${id}`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  /** Start an attempt — server stamps attempt id and duration. */
  async startAttempt(testId) {
    try {
      const { data } = await api.post(`/tests/${testId}/attempt`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  /**
   * Submit an attempt.
   * @param {object} payload - { attemptId, testId, answers, stats, durationUsedSec, autoSubmitted }
   */
  async submitAttempt(payload) {
    try {
      const { data } = await api.post(`/attempts/${payload.attemptId}/submit`, payload)
      return data.result
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async getResult(attemptId) {
    try {
      const { data } = await api.get(`/attempts/${attemptId}/result`)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  /** Attempt summaries for the dashboard/test list. */
  async myAttempts() {
    try {
      const { data } = await api.get('/users/me/attempts')
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
