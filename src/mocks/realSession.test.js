/**
 * Regression: a session created by the real Postgres API must not be rejected by
 * the still-mocked endpoints. Before the fix those answered 401 "unauthorized",
 * the axios interceptor cleared the session, and every click bounced the freshly
 * registered user back to /login.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
import { STORAGE_KEYS } from '@/lib/constants'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

const server = setupServer(...handlers)
const REAL_TOKEN = 'a'.repeat(64) // the shape Express issues: 64 hex chars

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const base = () => window.location.origin

const get = (path, token) =>
  fetch(`${base()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

const persistSession = (token, user) => {
  window.localStorage.setItem(
    STORAGE_KEYS.auth,
    JSON.stringify({ state: { user, token, status: 'authenticated' }, version: 0 })
  )
}

describe('mock layer accepts a real Postgres session', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('answers mocked protected endpoints instead of 401 for a real token', async () => {
    persistSession(REAL_TOKEN, {
      id: 'u-real-1',
      name: 'Fresh Student',
      email: 'fresh@example.com',
      role: 'student',
      profile: { group: 'science', hscGpa: 4.5 },
    })

    const attempts = await get('/api/users/me/attempts', REAL_TOKEN)
    expect(attempts.status).toBe(200)

    const analytics = await get('/api/users/me/analytics', REAL_TOKEN)
    expect(analytics.status).toBe(200)
  })

  it('still rejects an unknown token when no session is persisted', async () => {
    const res = await get('/api/users/me/attempts', 'deadbeef')
    expect(res.status).toBe(401)
  })

  it('keeps answering the seeded demo user', async () => {
    const login = await fetch(`${base()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com', password: 'password123' }),
    })
    const { token } = await login.json()
    const res = await get('/api/users/me/attempts', token)
    expect(res.status).toBe(200)
  })

  it('does not log the user out when a mocked page calls an API', async () => {
    const user = { id: 'u-real-2', name: 'Clicker', email: 'click@example.com', role: 'student' }
    useAuthStore.getState().setAuth({ user, token: REAL_TOKEN })

    await api.get('/users/me/attempts')
    await api.get('/tests')

    const state = useAuthStore.getState()
    expect(state.status).toBe('authenticated')
    expect(state.token).toBe(REAL_TOKEN)
    expect(state.user.email).toBe('click@example.com')
  })
})
