import { it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import '@/lib/i18n'
import PublicHubPage from '@/features/universities/pages/PublicHubPage'

it('public hub renders without an infinite render loop', async () => {
  const server = setupServer(...handlers)
  server.listen({ onUnhandledRequest: 'bypass' })
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><PublicHubPage /></MemoryRouter>
    </QueryClientProvider>
  )

  await waitFor(() => expect(document.body.textContent.length).toBeGreaterThan(200), { timeout: 8000 })
  console.log('RENDERED chars:', document.body.textContent.length)
  console.log('has university names:', /University|বিশ্ববিদ্যালয়/i.test(document.body.textContent))
  server.close()
}, 20000)
