import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@/lib/i18n' // registers locales used by useLocale()
import { ChatMessage } from './ChatMessage'

/**
 * Regression tests for two reported bugs:
 *  1. Bilingual `{ en, bn }` answer objects leaked into the renderer and
 *     showed "[object Object]" instead of the answer text.
 *  2. In-app sources (e.g. /app/private-universities) were rendered with
 *     target="_blank", so they reloaded the SPA into an empty page.
 */

const renderMessage = (message) =>
  render(
    <MemoryRouter>
      <ChatMessage message={message} onRetry={() => {}} />
    </MemoryRouter>
  )

/** Find a source chip by its destination, whatever the active language. */
const chipByHref = (href) => screen.getAllByRole('link').find((a) => a.getAttribute('href') === href)

describe('ChatMessage', () => {
  it('renders plain-string content (never "[object Object]")', () => {
    const { container } = renderMessage({
      role: 'assistant',
      content: '**Dhaka University** has about 4,361 seats.',
      status: 'done',
      sources: [],
    })
    expect(container.textContent).not.toContain('[object Object]')
    expect(container.textContent).toContain('4,361 seats')
  })

  it('renders an internal source as an in-app link, not a new tab', () => {
    renderMessage({
      role: 'assistant',
      content: 'See the directory.',
      status: 'done',
      sources: [
        { label: { en: 'Private directory (this app)', bn: 'তালিকা' }, url: '/app/private-universities' },
      ],
    })

    const chip = chipByHref('/app/private-universities')
    expect(chip).toBeDefined()
    // Internal links must NOT force a new tab — that is what broke navigation.
    expect(chip.hasAttribute('target')).toBe(false)
  })

  it('renders an external source as a new-tab link', () => {
    renderMessage({
      role: 'assistant',
      content: 'Official site.',
      status: 'done',
      sources: [{ label: { en: 'BUET Admission', bn: 'বুয়েট' }, url: 'https://admission.buet.ac.bd' }],
    })

    const chip = chipByHref('https://admission.buet.ac.bd')
    expect(chip).toBeDefined()
    expect(chip.getAttribute('target')).toBe('_blank')
    expect(chip.getAttribute('rel')).toContain('noopener')
  })

  it('does not misread protocol-relative URLs as internal routes', () => {
    renderMessage({
      role: 'assistant',
      content: 'External.',
      status: 'done',
      sources: [{ label: { en: 'External site', bn: 'বাইরের' }, url: '//cdn.example.com/x' }],
    })
    const chip = chipByHref('//cdn.example.com/x')
    expect(chip).toBeDefined()
    expect(chip.getAttribute('target')).toBe('_blank')
  })
})
