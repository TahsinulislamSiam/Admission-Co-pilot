import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@/lib/i18n'
import LandingPage from '@/features/landing/pages/LandingPage'

const renderLanding = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )

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
      'animate-float',
      'animate-drift-x',
      'animate-drift-y',
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
})
