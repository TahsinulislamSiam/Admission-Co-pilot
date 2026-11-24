import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/lib/i18n'
import i18n from '@/lib/i18n'
import LandingPage from '@/features/landing/pages/LandingPage'
import { universityService } from '@/services/universityService'
import { testService } from '@/services/testService'

vi.mock('@/services/universityService', () => ({
  universityService: { listPublic: vi.fn(), listPrivate: vi.fn() },
}))
vi.mock('@/services/testService', () => ({ testService: { list: vi.fn() } }))

const renderLanding = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </QueryClientProvider>
  )

beforeEach(() => {
  // 3 public + 2 private universities, 2 tests sharing 4 distinct questions.
  universityService.listPublic.mockResolvedValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
  universityService.listPrivate.mockResolvedValue([{ id: 'd' }, { id: 'e' }])
  testService.list.mockResolvedValue([
    { id: 't1', questionIds: ['q1', 'q2'] },
    { id: 't2', questionIds: ['q2', 'q3', 'q4'] },
  ])
})

describe('LandingPage', () => {
  it('renders the hero heading', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('applies entrance animation classes across the page', () => {
    const { container } = renderLanding()
    for (const cls of [
      'animate-fade-in-up',
      'animate-pop-in',
    ]) {
      expect(container.querySelectorAll(`.${cls}`).length, cls).toBeGreaterThan(0)
    }
  })

  it('links the navbar logo back to the home route', () => {
    renderLanding()
    // The navbar logo is the first link on the page and must target '/'.
    const logo = screen.getAllByRole('link')[0]
    expect(logo.getAttribute('href')).toBe('/')
  })

  it('fills the stat cards with live counts from the API', async () => {
    renderLanding()

    // universities = 3 public + 2 private, questions = 4 unique ids, tests = 2
    await waitFor(
      () => {
        const stats = within(screen.getByTestId('live-stats'))
        // The figures follow the UI language (Bangla digits when the app is in Bangla).
        const fmt = new Intl.NumberFormat(i18n.language?.startsWith('bn') ? 'bn-BD' : 'en-US')
        expect(stats.getByText(fmt.format(5))).toBeInTheDocument()
        expect(stats.getByText(fmt.format(4))).toBeInTheDocument()
        expect(stats.getByText(fmt.format(2))).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // The old hardcoded marketing numbers must be gone.
    expect(screen.queryByText('1,000+')).not.toBeInTheDocument()
    expect(screen.queryByText('20+')).not.toBeInTheDocument()
  })

  it('scrolls the motivational quotes in a seamless marquee', () => {
    const { container } = renderLanding()

    const band = screen.getByRole('region', { name: i18n.t('landing.quotesLabel') })
    const track = band.querySelector('.animate-marquee')
    expect(track).not.toBeNull()

    // The list is rendered twice so the -50% loop has no visible seam…
    const copies = track.querySelectorAll('ul')
    expect(copies).toHaveLength(2)
    expect(copies[0].querySelectorAll('li').length).toBeGreaterThanOrEqual(3)
    // …and the duplicate is hidden from screen readers.
    expect(copies[1].getAttribute('aria-hidden')).toBe('true')

    expect(container.querySelectorAll('.animate-marquee').length).toBe(1)
  })

  it('offers a dedicated admin login button on the home page', () => {
    renderLanding()
    expect(screen.getByRole('link', { name: /অ্যাডমিন লগইন/ })).toHaveAttribute(
      'href',
      '/admin/login'
    )
  })
})
