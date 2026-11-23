import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/lib/i18n'
import { newsService } from '@/services/newsService'
import NewspaperPage from './pages/NewspaperPage'

/**
 * Newspaper section: two featured paper cards with thumbnails, plus national and
 * international headlines that refresh themselves.
 */

const papers = [
  {
    id: 'prothom-alo',
    name: { en: 'Prothom Alo', bn: 'প্রথম আলো' },
    url: 'https://www.prothomalo.com',
    accent: '#e11d48',
    thumbnail: 'https://media.example.com/pa.jpg',
    headline: 'প্রথম আলোর সর্বশেষ',
    headlineUrl: 'https://www.prothomalo.com/latest',
  },
  {
    id: 'daily-star',
    name: { en: 'The Daily Star', bn: 'দ্য ডেইলি স্টার' },
    url: 'https://www.thedailystar.net',
    accent: '#0f766e',
    thumbnail: null, // feed carried no image → branded fallback tile
    headline: 'Daily Star latest',
    headlineUrl: 'https://www.thedailystar.net/latest',
  },
]

const national = {
  id: 'n1',
  title: 'জাতীয় শিরোনাম একটি',
  url: 'https://www.prothomalo.com/a',
  summary: 'সংক্ষিপ্ত সারাংশ',
  image: null,
  publishedAt: new Date(Date.now() - 3600e3).toISOString(),
  source: { id: 'prothom-alo', name: { en: 'Prothom Alo', bn: 'প্রথম আলো' }, scope: 'national' },
}
const international = {
  id: 'n2',
  title: 'International headline one',
  url: 'https://www.bbc.com/news/b',
  summary: 'Short summary',
  image: 'https://media.example.com/b.jpg',
  publishedAt: new Date(Date.now() - 7200e3).toISOString(),
  source: { id: 'bbc-world', name: { en: 'BBC World', bn: 'বিবিসি ওয়ার্ল্ড' }, scope: 'international' },
}

const payload = (items, scope = 'all') => ({
  scope,
  updatedAt: Date.now(),
  counts: { national: 1, international: 1 },
  failed: [],
  items,
})

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NewspaperPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  vi.restoreAllMocks()
  await i18n.changeLanguage('en')
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('newspaper section', () => {
  it('shows the two papers as links with thumbnails', async () => {
    vi.spyOn(newsService, 'papers').mockResolvedValue(papers)
    vi.spyOn(newsService, 'list').mockResolvedValue(payload([national, international]))

    const { container } = renderPage()

    await screen.findByText('প্রথম আলোর সর্বশেষ')
    const alo = container.querySelector('a[href="https://www.prothomalo.com"]')
    expect(alo).toBeTruthy()
    expect(alo).toHaveAttribute('target', '_blank')
    expect(alo.textContent).toContain('প্রথম আলোর সর্বশেষ')

    const star = container.querySelector('a[href="https://www.thedailystar.net"]')
    expect(star).toBeTruthy()
    expect(star.textContent).toContain('Daily Star latest')

    // the paper that shipped an image renders it
    expect(document.querySelector('img[src="https://media.example.com/pa.jpg"]')).toBeTruthy()
  })

  it('lists national and international headlines with their source', async () => {
    vi.spyOn(newsService, 'papers').mockResolvedValue(papers)
    vi.spyOn(newsService, 'list').mockResolvedValue(payload([national, international]))

    renderPage()

    const title = await screen.findByText('জাতীয় শিরোনাম একটি')
    expect(title).toBeTruthy()
    expect(screen.getByText('International headline one')).toBeTruthy()
    expect(screen.getByText('BBC World')).toBeTruthy()
    // each headline links out to the publisher
    expect(title.closest('a')).toHaveAttribute('href', 'https://www.prothomalo.com/a')
  })

  it('filters to one scope when a tab is clicked', async () => {
    const user = userEvent.setup()
    vi.spyOn(newsService, 'papers').mockResolvedValue(papers)
    const list = vi
      .spyOn(newsService, 'list')
      .mockImplementation((scope) =>
        Promise.resolve(scope === 'national' ? payload([national], 'national') : payload([national, international]))
      )

    renderPage()
    await screen.findByText('International headline one')

    await user.click(screen.getByRole('button', { name: /^National/ }))

    await waitFor(() => expect(list).toHaveBeenCalledWith('national', 24))
    await waitFor(() => expect(screen.queryByText('International headline one')).toBeNull())
    expect(screen.getByText('জাতীয় শিরোনাম একটি')).toBeTruthy()
  })

  it('refetches when the refresh button is used', async () => {
    const user = userEvent.setup()
    vi.spyOn(newsService, 'papers').mockResolvedValue(papers)
    const list = vi.spyOn(newsService, 'list').mockResolvedValue(payload([national]))

    renderPage()
    await screen.findByText('জাতীয় শিরোনাম একটি')
    const before = list.mock.calls.length

    await user.click(screen.getByRole('button', { name: /Refresh/i }))

    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(before))
  })

  it('shows an empty state when no feed returned anything', async () => {
    vi.spyOn(newsService, 'papers').mockResolvedValue([])
    vi.spyOn(newsService, 'list').mockResolvedValue(payload([]))

    renderPage()

    expect(await screen.findByText(/no headlines right now/i)).toBeTruthy()
  })
})
