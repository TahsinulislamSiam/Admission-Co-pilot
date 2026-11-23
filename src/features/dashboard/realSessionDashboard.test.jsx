/**
 * Regression: the dashboard must survive a session created by the real Postgres
 * API. Its data calls go to the mock worker, which used to 401 them and log the
 * user out mid-click (they landed back on /login right after registering).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { handlers } from '@/mocks/handlers'
import { STORAGE_KEYS } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import '@/lib/i18n'
import DashboardPage from './pages/DashboardPage'

const server = setupServer(...handlers)
const REAL_TOKEN = 'b'.repeat(64)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

beforeEach(() => {
  window.localStorage.clear()
  useAuthStore.getState().setAuth({
    user: {
      id: 'u-real-9',
      name: 'Fresh Student',
      email: 'fresh9@example.com',
      role: 'student',
      profile: { group: 'science', hscGpa: 4.5 },
    },
    token: REAL_TOKEN,
  })
})

describe('dashboard with a real Postgres session', () => {
  it('renders and keeps the session instead of bouncing to login', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/app/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(container.innerHTML.length).toBeGreaterThan(200)
    await waitFor(() => expect(screen.queryByText(/লোড হচ্ছে/)).not.toBeInTheDocument(), {
      timeout: 3000,
    })

    const state = useAuthStore.getState()
    expect(state.status).toBe('authenticated')
    expect(state.token).toBe(REAL_TOKEN)
    expect(window.localStorage.getItem(STORAGE_KEYS.auth)).toContain(REAL_TOKEN)
  })
})
