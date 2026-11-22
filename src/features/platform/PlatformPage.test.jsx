import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/lib/i18n'
import PlatformPage from './pages/PlatformPage'

/**
 * Smoke test for the Platform page: the dataset renders, the honesty badges are
 * there, and the search/focus filters actually narrow the list.
 */
beforeAll(async () => {
  await i18n.changeLanguage('en')
})

describe('PlatformPage', () => {
  it('renders every platform with its focus tags and links', () => {
    render(<PlatformPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Platform')
    expect(screen.getByText('UCC (University Coaching Center)')).toBeInTheDocument()
    expect(screen.getByText('Udvash Academic & Admission Care')).toBeInTheDocument()
    expect(screen.getByText('10 of 10 platforms')).toBeInTheDocument()
  })

  it('shows a discovery link, not a dead end, when a platform has no site', () => {
    render(<PlatformPage />)
    // Focus, Mentors', Saifur's, ICON, MEDICO, Paragon publish no official site.
    expect(screen.getAllByText(/Find official site/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Official platform/).length).toBeGreaterThan(0)
  })

  it('marks the randomly generated success rates as samples', () => {
    render(<PlatformPage />)
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getAllByText('Sample')).toHaveLength(10)
    expect(screen.queryByText('Rate not verified')).not.toBeInTheDocument()
  })

  it('filters by search text', async () => {
    const user = userEvent.setup()
    render(<PlatformPage />)
    await user.type(screen.getByPlaceholderText(/Search a platform/), 'udvash')
    expect(screen.getByText('Udvash Academic & Admission Care')).toBeInTheDocument()
    expect(screen.queryByText('UCC (University Coaching Center)')).not.toBeInTheDocument()
    expect(screen.getByText('1 of 10 platforms')).toBeInTheDocument()
  })

  it('filters by focus tag', async () => {
    const user = userEvent.setup()
    render(<PlatformPage />)
    // The chips are the only role=button occurrences; card tags are spans.
    await user.click(screen.getByRole('button', { name: 'Medical admission' }))
    expect(screen.getByText('RETINA Medical & Dental Admission Coaching')).toBeInTheDocument()
    expect(screen.queryByText('Udvash Academic & Admission Care')).not.toBeInTheDocument()
  })
})
