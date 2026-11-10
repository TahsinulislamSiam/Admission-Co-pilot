import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import '@/lib/i18n'
import LoginPage from './LoginPage'

// i18n default language is Bangla (bn) — assertions use the bn strings.
const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>
  )

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the login form with title and CTAs', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: 'স্বাগতম ফিরে আসার জন্য' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /লগইন/ })).toBeInTheDocument()
    expect(screen.getByLabelText(/ইমেইল/)).toBeInTheDocument()
    expect(screen.getByLabelText(/পাসওয়ার্ড/)).toBeInTheDocument()
  })

  it('shows required-field errors when submitted empty', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /লগইন/ }))

    expect(await screen.findByText('ইমেইল আবশ্যক')).toBeInTheDocument()
    expect(screen.getByText('পাসওয়ার্ড আবশ্যক')).toBeInTheDocument()
  })

  it('shows an invalid-email error for a malformed address', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/ইমেইল/), 'not-an-email')
    await user.type(screen.getByLabelText(/পাসওয়ার্ড/), 'password123')
    await user.click(screen.getByRole('button', { name: /লগইন/ }))

    expect(await screen.findByText('সঠিক ইমেইল দিন')).toBeInTheDocument()
  })

  it('links to register and forgot-password routes', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: 'রেজিস্ট্রেশন' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: /পাসওয়ার্ড মনে নেই/ })).toHaveAttribute(
      'href',
      '/forgot-password'
    )
  })
})
