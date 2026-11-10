import { api, normalizedError } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

/** Auth & profile API (FR-1). All calls go through the shared axios instance. */
export const authService = {
  async login({ email, password }) {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      useAuthStore.getState().setAuth(data)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async register({ name, email, password, sscGpa, hscGpa, group }) {
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        sscGpa,
        hscGpa,
        group,
      })
      useAuthStore.getState().setAuth(data)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  async forgotPassword(email) {
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  /** Re-validate the persisted token on app boot. */
  async me() {
    try {
      const { data } = await api.get('/auth/me')
      useAuthStore.getState().setUser(data)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },

  logout() {
    useAuthStore.getState().logout()
  },

  async updateProfile(profile) {
    try {
      const { data } = await api.patch('/users/me/profile', profile)
      useAuthStore.getState().setUser(data)
      return data
    } catch (e) {
      throw normalizedError(e)
    }
  },
}
