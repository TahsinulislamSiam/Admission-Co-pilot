/**
 * Professors section: the student directory groups rows by university and lets
 * the reader filter by research field; the admin page adds and removes rows.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/lib/i18n'
import { professorService } from '@/services/professorService'
import { ProfessorsPage } from './pages/ProfessorsPage'
import { AdminProfessorsPage } from '@/features/admin/pages/AdminProfessorsPage'

vi.mock('@/services/professorService', () => ({
  professorService: { list: vi.fn(), create: vi.fn(), remove: vi.fn() },
}))

const rows = [
  {
    id: 'p1',
    university: 'Stanford University',
    city: 'Stanford',
    country: 'United States',
    universityRank: 2,
    universityWebsite: 'https://www.stanford.edu/',
    name: 'Fei-Fei Li',
    title: 'Professor',
    department: 'Computer Science',
    email: null,
    researchFields: ['Artificial Intelligence', 'Computer Vision'],
    profileUrl: 'https://ai.stanford.edu/faculty/',
  },
  {
    id: 'p2',
    university: 'University of Oxford',
    city: 'Oxford',
    country: 'United Kingdom',
    universityRank: 4,
    universityWebsite: 'https://www.ox.ac.uk/',
    name: 'Stephen Roberts',
    title: 'Professor of Machine Learning',
    department: 'Engineering Science',
    email: 'sjrob@robots.ox.ac.uk',
    researchFields: ['Machine Learning', 'Sequential Data'],
    profileUrl: 'https://eng.ox.ac.uk/people/stephen-roberts',
  },
]

const renderPage = (ui) => {
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
  professorService.list.mockResolvedValue(rows)
  professorService.create.mockResolvedValue({ id: 'p3' })
  professorService.remove.mockResolvedValue({ deleted: true })
})

describe('student faculty directory', () => {
  it('groups professors by university with rank and contact', async () => {
    renderPage(<ProfessorsPage />)
    expect(await screen.findByText('Fei-Fei Li')).toBeInTheDocument()
    expect(screen.getByText('Stephen Roberts')).toBeInTheDocument()
    expect(screen.getByText('Stanford University')).toBeInTheDocument()
    expect(screen.getByText('University of Oxford')).toBeInTheDocument()
    expect(screen.getByText('QS #2')).toBeInTheDocument()
    // Oxford professor has a public email, Stanford's has none
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('No public email')).toBeInTheDocument()
  })

  it('filters by research field', async () => {
    renderPage(<ProfessorsPage />)
    const user = userEvent.setup()
    await screen.findByText('Fei-Fei Li')
    await user.click(screen.getByRole('button', { name: 'Computer Vision' }))
    expect(screen.getByText('Fei-Fei Li')).toBeInTheDocument()
    expect(screen.queryByText('Stephen Roberts')).not.toBeInTheDocument()
  })
})

describe('admin professors editor', () => {
  it('lists professors and adds a new one', async () => {
    renderPage(<AdminProfessorsPage />)
    const user = userEvent.setup()
    expect(await screen.findByText('Fei-Fei Li')).toBeInTheDocument()

    await user.type(screen.getByLabelText('University name'), 'Imperial College London')
    await user.type(screen.getByLabelText('Professor name'), 'Ben Glocker')
    await user.type(screen.getByLabelText('Research fields'), 'Machine Learning, Medical Imaging')
    await user.click(screen.getByRole('button', { name: /add professor/i }))

    await waitFor(() => {
      expect(professorService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          university: 'Imperial College London',
          name: 'Ben Glocker',
          researchFields: 'Machine Learning, Medical Imaging',
        })
      )
    })
  })

  it('removes a professor', async () => {
    renderPage(<AdminProfessorsPage />)
    const user = userEvent.setup()
    await screen.findByText('Fei-Fei Li')

    const removeButtons = screen.getAllByRole('button', { name: /remove professor/i })
    await user.click(removeButtons[0])

    await waitFor(() => expect(professorService.remove).toHaveBeenCalledWith('p1'))
  })
})
