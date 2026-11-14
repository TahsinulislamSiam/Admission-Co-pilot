import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildGroundingContext, knownSources } from './prompt.js'

describe('assistant prompt builder', () => {
  it('includes the verified records in the grounding context', () => {
    const ctx = buildGroundingContext()
    expect(ctx).toContain('BUET')
    expect(ctx.length).toBeGreaterThan(200)
  })

  it('exposes deduplicated official sources', () => {
    const sources = knownSources()
    expect(sources.length).toBeGreaterThan(0)
    const urls = sources.map((s) => s.url)
    expect(new Set(urls).size).toBe(urls.length)
    for (const s of sources) {
      expect(s.url).toMatch(/^https?:\/\//)
      expect(s.label.en).toBeTruthy()
    }
  })

  it('asks for Bangla and English replies respectively', () => {
    expect(buildSystemPrompt('bn')).toContain('Bangla')
    expect(buildSystemPrompt('en')).toContain('English')
  })

  it('forbids inventing figures and requires the no-record marker', () => {
    const prompt = buildSystemPrompt('en')
    expect(prompt).toContain('Never invent')
    expect(prompt).toContain('[[NO_RECORD]]')
  })
})
