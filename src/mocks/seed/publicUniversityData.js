/**
 * Public university dataset (FR-2, FR-4).
 *
 * Two sources are combined here so nothing is lost:
 *
 *   1. ./publicUniversities.js — hand-curated records with admission UNITS
 *      (DU 'A'/'B'/'C'), seats, exam dates, eligibility GPAs, deadlines.
 *      This is the core of the public-admission feature, so it stays the base.
 *
 *   2. ./public.json — a curated set of 10 major public universities with
 *      representative DEPARTMENT lists and estimated total degree cost RANGES
 *      (BDT). It has no units/exam data.
 *
 * mergeDepartments() layers (2) onto (1) by short_name. Universities that only
 * exist in the base seed (KUET, JNU, IUT) keep their records and simply carry
 * no department cost data; a university that only exists in the JSON (BAU) is
 * appended with departments and no units.
 *
 * Cost caveat: the JSON figures are broad planning ranges, not official
 * quotations — see publicUniversitiesMeta.costWarning.
 */
import raw from './public.json' with { type: 'json' }
import { publicUniversities as baseUniversities } from './publicUniversities.js'

const bdt = (n) => (typeof n === 'number' ? n : null)

const rangeOf = (obj) => ({ min: bdt(obj?.min), max: bdt(obj?.max) })

const metadata = raw.metadata || {}

export const publicUniversitiesMeta = {
  title: metadata.title || 'Public Universities',
  createdOn: metadata.created_on || null,
  costDefinition: metadata.cost_definition || null,
  costWarning: metadata.important_cost_warning || null,
  costExclusions: metadata.cost_exclusions || [],
  departmentNote: metadata.department_note || null,
  rankingNote: metadata.ranking_note || null,
  sources: metadata.sources || [],
}

const slug = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Build the department records for one JSON university entry. */
const toDepartments = (uniId, jsonUni) =>
  (jsonUni.departments || []).map((d, i) => {
    const range = rangeOf(d.estimated_total_degree_cost_bdt)
    return {
      id: `${uniId}-d${i + 1}`,
      // Free-text department name from the dataset
      name: { en: d.department, bn: d.department },
      dept: null,
      costMin: range.min,
      costMax: range.max,
      // Midpoint keeps numeric sorting / budget maths working
      totalCost:
        range.min != null && range.max != null
          ? Math.round((range.min + range.max) / 2)
          : (range.min ?? range.max),
      costStatus: d.cost_status || 'estimated_not_official',
      costNote: d.cost_note || null,
    }
  })

/** Index the JSON dataset by short_name so lookup is not order-dependent. */
const jsonByShortName = new Map(
  (raw.universities || []).map((u) => [String(u.short_name || '').toUpperCase(), u])
)

/** Merge department cost data onto one base record. */
const withDepartments = (base) => {
  const key = String(base.shortName?.en || '').toUpperCase()
  const jsonUni = jsonByShortName.get(key)
  if (!jsonUni) return { ...base, departments: base.departments || [] }

  const uniRange = rangeOf(jsonUni.estimated_total_degree_cost_bdt)
  return {
    ...base,
    // Base aliases win for units/exam data; JSON fills in departments + cost.
    departments: toDepartments(base.id, jsonUni),
    costMin: uniRange.min,
    costMax: uniRange.max,
    costBasis: jsonUni.cost_basis || null,
    location: jsonUni.location || null,
  }
}

/** Universities present only in the JSON (e.g. BAU) become new records. */
const recordsOnlyInJson = () => {
  const seen = new Set(
    baseUniversities.map((u) => String(u.shortName?.en || '').toUpperCase())
  )
  return (raw.universities || [])
    .filter((u) => !seen.has(String(u.short_name || '').toUpperCase()))
    .map((u) => {
      const id = slug(u.short_name || u.name)
      const uniRange = rangeOf(u.estimated_total_degree_cost_bdt)
      return {
        id,
        name: { en: u.name, bn: u.name },
        shortName: { en: u.short_name, bn: u.short_name },
        city: { en: u.location || 'Dhaka', bn: u.location || 'Dhaka' },
        type: 'public',
        rank: u.rank_in_dataset ?? null,
        established: null,
        seatsTotal: null,
        applicationFee: null,
        examPattern: null,
        groups: [],
        minSscGpa: null,
        minHscGpa: null,
        applicationStart: null,
        deadline: null,
        examDate: null,
        website: u.official_website || null,
        sourceUrl: u.official_website || null,
        lastVerified: metadata.created_on || null,
        // No admission-unit data exists for these, so keep it empty.
        units: [],
        departments: toDepartments(id, u),
        costMin: uniRange.min,
        costMax: uniRange.max,
        costBasis: u.cost_basis || null,
        location: u.location || null,
      }
    })
}

export const publicUniversities = [
  ...baseUniversities.map(withDepartments),
  ...recordsOnlyInJson(),
]

export default publicUniversities
