import { describe, it, expect } from 'vitest'
import { platforms, allFocus, focusLabel, datasetMeta, withSiteCount, successRatesAreSample } from './platformData'

/**
 * The Platform page is only as honest as this dataset, so these tests pin the
 * rules the UI relies on: every platform is reachable, a missing success rate is
 * explained rather than invented, and ids are unique.
 */
describe('platform data', () => {
  it('loads every centre from platform.json', () => {
    expect(platforms.length).toBe(10)
    expect(withSiteCount).toBeGreaterThan(0)
  })

  it('gives each platform a unique id and a name', () => {
    const ids = platforms.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of platforms) expect(p.name.length).toBeGreaterThan(0)
  })

  it('leaves no platform without a link', () => {
    for (const p of platforms) {
      expect(Boolean(p.site || p.discoveryUrl)).toBe(true)
      // discoveryUrl only stands in when there is no official site
      if (p.site) expect(p.discoveryUrl).toBeNull()
    }
  })

  it('never shows a success rate without a number and an explanation', () => {
    for (const p of platforms) {
      if (p.successRate === null) {
        expect(p.successRateNote.length).toBeGreaterThan(0)
      } else {
        expect(typeof p.successRate).toBe('number')
        expect(p.successRate).toBeGreaterThanOrEqual(0)
        expect(p.successRate).toBeLessThanOrEqual(100)
        // A rate is only shown with its note, and sample rates are flagged.
        expect(p.successRateNote.length).toBeGreaterThan(0)
      }
    }
  })

  it('flags the randomly generated rates as samples', () => {
    expect(successRatesAreSample).toBe(true)
    expect(platforms.every((p) => typeof p.successRate === 'number')).toBe(true)
    for (const p of platforms) expect(p.successRateNote).toMatch(/not a verified/i)
  })

  it('keeps the dataset notes for the banner', () => {
    expect(datasetMeta.notes.length).toBeGreaterThan(0)
    expect(datasetMeta.country).toBe('Bangladesh')
  })

  it('translates known focus tags and falls back to the raw text', () => {
    expect(focusLabel('University admission', 'bn')).toBe('বিশ্ববিদ্যালয় ভর্তি')
    expect(focusLabel('Medical admission', 'en')).toBe('Medical admission')
    expect(focusLabel('Some new tag', 'en')).toBe('Some new tag')
    expect(allFocus).toContain('University admission')
  })
})
