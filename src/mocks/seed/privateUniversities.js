/**
 * Private university records (FR-3, FR-4).
 *
 * Source of truth: ./private.json — a curated shortlist of the top 10 private
 * universities in Bangladesh with *estimated total degree cost ranges* (BDT).
 *
 * The JSON is imported directly so edits to it take effect with no code change.
 * Here we only normalise it into the shape the UI consumes:
 *   - every university gets an `id`, a `city` and bilingual name objects
 *   - Cost values are ranges { min, max }. `totalCost` is kept as the range
 *     midpoint so existing cost/locale helpers keep working, while `costMin`
 *     / `costMax` carry the honest range for display.
 *   - The dataset has no credits, seats, deadlines or waiver rules, so those
 *     fields are intentionally absent (the UI shows "—" for them).
 */
// Import attribute syntax is required by Node (the assistant server imports
// this module) and supported by Vite. ESLint's parser cannot read it yet, so
// the next line is disabled for the linter only.
// eslint-disable-next-line
import raw from './private.json' with { type: 'json' }

const bdt = (n) => (typeof n === 'number' ? n : null)

/** Slug ids for the shortlist so URLs stay stable and readable. */
const ID_BY_SHORT_NAME = {
  NSU: 'nsu',
  BRACU: 'brac',
  AUST: 'aust',
  AIUB: 'aiub',
  EWU: 'ewu',
  UIU: 'uiu',
  IUB: 'iub',
  DIU: 'diu',
  BUBT: 'bubt',
  SEU: 'seu',
}

/** City display text comes straight from the JSON `location` string. */
const cityOf = (location) => {
  const parts = String(location || '').split(',')
  return parts[parts.length - 1].trim() || 'Dhaka'
}

const rangeOf = (obj) => ({
  min: bdt(obj?.min),
  max: bdt(obj?.max),
})

/** Build one department record from a JSON `department_costs` entry. */
const toDepartment = (uniId, entry, index, uniRange) => {
  const cost = rangeOf(entry.estimated_total_degree_cost_bdt)
  const range = cost.min != null && cost.max != null ? cost : uniRange
  return {
    id: `${uniId}-d${index + 1}`,
    // Free-text department name from the dataset (not a fixed dept key)
    name: { en: entry.department, bn: entry.department },
    dept: null,
    costMin: range.min,
    costMax: range.max,
    // Midpoint keeps numeric sorting / budget maths working
    totalCost: range.min != null && range.max != null ? Math.round((range.min + range.max) / 2) : range.min ?? range.max,
    costType: entry.cost_type || 'estimated_total_program_cost',
    includes: entry.includes || null,
    // Present on rows added as planning estimates; the UI badges these.
    basis: entry.basis || null,
  }
}

const metadata = raw.metadata || {}

export const privateUniversitiesMeta = {
  title: metadata.title || 'Private Universities',
  lastUpdated: metadata.last_updated || null,
  costNote: metadata.cost_note || null,
  rankingNote: metadata.ranking_note || null,
  sources: metadata.sources || [],
}

export const privateUniversities = (raw.universities || []).map((u) => {
  const id = ID_BY_SHORT_NAME[u.short_name] || String(u.short_name || u.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const uniRange = rangeOf(u.estimated_total_degree_cost_bdt)
  const perCredit = u.estimated_per_credit_fee_bdt ? rangeOf(u.estimated_per_credit_fee_bdt) : { min: null, max: null }

  return {
    id,
    rank: u.rank_in_shortlist ?? null,
    name: { en: u.name, bn: u.name },
    shortName: { en: u.short_name, bn: u.short_name },
    city: { en: cityOf(u.location), bn: cityOf(u.location) },
    location: u.location || null,
    type: 'private',
    established: null,
    website: u.official_website || null,
    feeScheduleUrl: u.official_fee_schedule_url || null,
    sourceUrl: u.official_website || null,
    lastVerified: metadata.last_updated || null,
    // Cost ranges (see notes above)
    costMin: uniRange.min,
    costMax: uniRange.max,
    totalCost: uniRange.min != null && uniRange.max != null ? Math.round((uniRange.min + uniRange.max) / 2) : uniRange.min ?? uniRange.max,
    perCreditMin: perCredit.min,
    perCreditMax: perCredit.max,
    departments: (u.department_costs || []).map((entry, i) => toDepartment(id, entry, i, uniRange)),
    departmentNames: u.departments || [],
  }
})

export default privateUniversities
