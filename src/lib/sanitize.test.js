import { describe, it, expect } from 'vitest'
import { sanitizeText } from './sanitize'

describe('sanitizeText (NFR: AI output must be safe HTML)', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeText('')).toBe('')
    expect(sanitizeText(null)).toBe('')
    expect(sanitizeText(undefined)).toBe('')
  })

  it('strips <script> tags entirely while keeping the text', () => {
    const out = sanitizeText('Hello <script>alert("xss")</script> World')
    expect(out).not.toContain('<script>')
    expect(out).toContain('Hello')
    expect(out).toContain('World')
  })

  it('removes inline event handlers and html tags', () => {
    const out = sanitizeText('<img src=x onerror=alert(1)>click me</img>')
    expect(out).not.toContain('<img')
    expect(out).not.toContain('onerror')
    expect(out).toContain('click me')
  })

  it('drops dangerous anchor/javascript markup but keeps words', () => {
    const out = sanitizeText('<a href="javascript:alert(1)">click</a>')
    expect(out).not.toContain('javascript:')
    expect(out).toContain('click')
  })

  it('keeps markdown formatting as plain text (rendered by react-markdown)', () => {
    const md = '**ধাপ ১:** বল = ভর × ত্বরণ\n\n- বল একটি ভেক্টর রাশি'
    expect(sanitizeText(md)).toBe(md)
  })

  it('keeps plain Bangla text untouched', () => {
    const bn = 'নিউটনের দ্বিতীয় সূত্র অনুযায়ী বলের একক নিউটন (N)。'
    expect(sanitizeText(bn)).toBe(bn)
  })
})
