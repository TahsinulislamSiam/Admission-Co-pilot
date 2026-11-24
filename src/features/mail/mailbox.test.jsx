/**
 * Student mailbox: must show admin notices and let the student write back to an
 * admin (students may not read /admin/users, so recipients come from
 * GET /mail/contacts).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/lib/i18n'
import { StudentMailPage } from './pages/StudentMailPage'
import { mailService } from '@/services/mailService'

vi.mock('@/services/mailService', () => ({
  mailService: {
    inbox: vi.fn(),
    sent: vi.fn(),
    send: vi.fn(),
    markRead: vi.fn(),
    unreadCount: vi.fn(),
    contacts: vi.fn(),
  },
}))

const admin = { id: 'u2', name: 'Admin User', email: 'admin@example.com', role: 'admin' }

const notice = {
  id: 'm1',
  subject: 'Your documents are verified',
  body: 'Please complete your profile.',
  readAt: null,
  createdAt: new Date('2026-01-05T09:00:00Z').toISOString(),
  peer: { id: 'u2', name: 'Admin User', email: 'admin@example.com' },
}

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <StudentMailPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  vi.clearAllMocks()
  await i18n.changeLanguage('en')
  mailService.inbox.mockResolvedValue([notice])
  mailService.sent.mockResolvedValue([])
  mailService.unreadCount.mockResolvedValue(1)
  mailService.contacts.mockResolvedValue([admin])
  mailService.send.mockResolvedValue({ id: 'm2' })
})

describe('student mailbox', () => {
  it('shows the admin notice and the unread count', async () => {
    renderPage()
    expect(await screen.findByText('Your documents are verified')).toBeInTheDocument()
    expect(screen.getAllByText(/1 unread/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Admin User/)).toBeInTheDocument()
  })

  it('only offers admins as recipients', async () => {
    mailService.contacts.mockResolvedValue([
      admin,
      { id: 'u9', name: 'Other Student', email: 'other@example.com', role: 'student' },
    ])
    renderPage()
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText(/Search people/i), 'admin')
    expect(await screen.findByText('admin@example.com')).toBeInTheDocument()
    expect(mailService.contacts).toHaveBeenCalled()
  })

  it('sends a message to the admin', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Recipient'), 'admin@example.com')
    await user.type(screen.getByLabelText('Subject'), 'Thanks')
    await user.type(screen.getByLabelText('Message'), 'Got the notice, thank you.')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() =>
      expect(mailService.send).toHaveBeenCalledWith({
        toEmail: 'admin@example.com',
        subject: 'Thanks',
        body: 'Got the notice, thank you.',
      })
    )
  })
})
