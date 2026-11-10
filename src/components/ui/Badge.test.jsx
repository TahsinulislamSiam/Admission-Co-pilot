import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import { Button } from './Button'

describe('Badge', () => {
  it('renders children with the default variant', () => {
    render(<Badge>Approved</Badge>)
    const el = screen.getByText('Approved')
    expect(el).toBeInTheDocument()
    expect(el.className).toContain('bg-slate-100')
  })

  it.each([
    ['success', 'bg-emerald-100 text-emerald-800'],
    ['warning', 'bg-amber-100 text-amber-800'],
    ['danger', 'bg-rose-100 text-rose-800'],
    ['brand', 'bg-brand-100 text-brand-800'],
  ])('applies the %s variant classes', (variant, classes) => {
    const { container } = render(<Badge variant={variant}>x</Badge>)
    expect(container.firstChild.className).toContain(classes)
  })
})

describe('Button', () => {
  it('renders its label (HTML default type is submit)', () => {
    render(<Button>Save me</Button>)
    const btn = screen.getByRole('button', { name: 'Save me' })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toHaveAttribute('type', 'button')
  })

  it('is disabled while loading and shows a spinner', () => {
    render(<Button loading>Working</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.querySelector('.animate-spin')).not.toBeNull()
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Nope</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
