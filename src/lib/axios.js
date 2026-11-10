import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

/**
 * Single configured axios instance.
 * - baseURL comes from env (defaults to /api which MSW intercepts in dev).
 * - Attaches bearer token from the auth store.
 * - Normalizes errors and logs the user out on 401.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const isLoginRequest = error.config?.url?.includes('/auth/login')

    // Session expired / invalid token -> clear local auth (except failed logins)
    if (status === 401 && !isLoginRequest) {
      useAuthStore.getState().clearAuth()
    }

    return Promise.reject(
      Object.assign(error, {
        normalized: {
          status: status ?? 0,
          message:
            error.response?.data?.message ||
            (error.code === 'ECONNABORTED'
              ? 'timeout'
              : error.message || 'networkError'),
          code: error.code || null,
        },
      })
    )
  }
)

/** Convenience accessor for normalized errors in services/UI. */
export const normalizedError = (error) =>
  error?.normalized ?? { status: 0, message: error?.message || 'networkError' }
