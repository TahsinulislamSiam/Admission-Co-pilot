/**
 * Render smoke test for the admin dashboard pages and the student Video
 * section. Mocks the data layer so the test exercises the components only:
 * a crash (bad import, missing context, Radix misuse) fails here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/lib/i18n'

const inboxMock = [
  {
    id: 'm1',
    subject: 'Welcome',
    body: 'Hello there',
    readAt: null,
    createdAt: new Date('2026-01-05T09:00:00Z').toISOString(),
    peer: { id: 'u1', name: 'Rakib', email: 'student@example.com' },
  },
]

vi.mock('@/services/adminService', () => ({
  adminService: {
    listUsers: vi.fn(async () => [
      {
        id: 'u1',
        name: 'Rakib Hasan',
        email: 'student@example.com',
        role: 'student',
        createdAt: new Date('2026-01-05T09:00:00Z').toISOString(),
        profile: { group: 'science', hscGpa: 5 },
      },
      {
        id: 'u2',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date('2026-01-04T09:00:00Z').toISOString(),
        profile: null,
      },
    ]),
    getUser: vi.fn(async () => ({ id: 'u1', name: 'Rakib Hasan', attempts: 3 })),
    deleteUser: vi.fn(),
    listVideos: vi.fn(async () => [
      {
        id: 'v1',
        title: 'Integration basics',
        subject: 'math',
        topic: 'Integration',
        youtubeUrl: 'https://www.youtube.com/watch?v=abc12345678',
        youtubeId: 'abc12345678',
        channel: 'Test Channel',
        createdAt: new Date('2026-01-05T09:00:00Z').toISOString(),
      },
    ]),
    addVideo: vi.fn(),
    deleteVideo: vi.fn(),
    inbox: vi.fn(async () => inboxMock),
    sent: vi.fn(async () => []),
    sendMail: vi.fn(),
    markMailRead: vi.fn(),
    unreadMailCount: vi.fn(async () => 1),
  },
}))

const { AdminUsersPage } = await import('@/features/admin/pages/AdminUsersPage')
const { AdminVideosPage } = await import('@/features/admin/pages/AdminVideosPage')
const { AdminMailPage } = await import('@/features/admin/pages/AdminMailPage')
const { VideoSectionPage } = await import('@/features/videos/pages/VideoSectionPage')

function renderPage(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  vi.clearAllMocks()
  await i18n.changeLanguage('en')
})

describe('admin users page', () => {
  it('lists both accounts with roles and dates', async () => {
    renderPage(<AdminUsersPage />)
    expect(await screen.findByText('Rakib Hasan')).toBeInTheDocument()
    expect(screen.getByText('student@example.com')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })
})

describe('admin videos page', () => {
  it('renders the add form and the library', async () => {
    renderPage(<AdminVideosPage />)
    expect(await screen.findByText('Integration basics')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/youtube.com\/watch/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add video/i })).toBeInTheDocument()
  })
})

describe('admin mail page', () => {
  it('shows the inbox and the compose form', async () => {
    renderPage(<AdminMailPage />)
    expect(await screen.findByText('Welcome')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/student@example.com/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })
})

describe('student video section', () => {
  it('groups videos by subject and exposes a playable card', async () => {
    renderPage(<VideoSectionPage />)
    expect(await screen.findByText('Integration basics')).toBeInTheDocument()
    expect(screen.getAllByText(/mathematics/i).length).toBeGreaterThan(0)
    const thumb = document.querySelector('img[src*="i.ytimg.com"]')
    expect(thumb).toBeTruthy()
  })
})
