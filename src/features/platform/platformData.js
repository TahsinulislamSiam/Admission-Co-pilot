/**
 * Platform feature — coaching / admission platforms dataset.
 *
 * Single source of truth: `platform.json` in the project root. It is imported
 * directly instead of being copied into `src/mocks/seed/`, so the file the data
 * team edits is the file the app renders, and the page works in both mock and
 * live mode (no API route, no MSW handler).
 *
 * Honesty rule (same as the AI assistant): a success rate is only shown when the
 * dataset carries a verified percentage. Today every entry is `null`, so the UI
 * shows the note instead of inventing a number.
 */
import dataset from '../../../platform.json'

/** Dataset-level metadata shown in the page banner. */
export const datasetMeta = {
  title: dataset.dataset_title || '',
  country: dataset.country || '',
  createdAt: dataset.created_at || '',
  notes: Array.isArray(dataset.notes) ? dataset.notes : [],
}

/**
 * The success-rate percentages in `platform.json` are randomly generated demo
 * values, so the UI labels them as samples instead of presenting them as verified
 * results. Set `success_rate_is_demo` to false once real figures are entered.
 */
export const successRatesAreSample = Boolean(dataset.success_rate_is_demo)

/** Focus tags in the dataset are English; these give Bangla labels too. */
const FOCUS_LABELS = {
  'university admission': { en: 'University admission', bn: 'বিশ্ববিদ্যালয় ভর্তি' },
  'engineering admission': { en: 'Engineering admission', bn: 'ইঞ্জিনিয়ারিং ভর্তি' },
  'medical admission': { en: 'Medical admission', bn: 'মেডিকেল ভর্তি' },
  'dental admission': { en: 'Dental admission', bn: 'ডেন্টাল ভর্তি' },
  'iba admission': { en: 'IBA admission', bn: 'আইবিএ ভর্তি' },
  'academic coaching': { en: 'Academic coaching', bn: 'একাডেমিক কোচিং' },
  science: { en: 'Science', bn: 'বিজ্ঞান' },
  commerce: { en: 'Commerce', bn: 'ব্যবসায় শিক্ষা' },
  humanities: { en: 'Humanities', bn: 'মানবিক' },
  hsc: { en: 'HSC', bn: 'এইচএসসি' },
  english: { en: 'English', bn: 'ইংরেজি' },
  'spoken english': { en: 'Spoken English', bn: 'স্পোকেন ইংলিশ' },
  ielts: { en: 'IELTS', bn: 'আইইএলটিএস' },
  sat: { en: 'SAT', bn: 'এসএটি' },
  gre: { en: 'GRE', bn: 'জিআরই' },
  gmat: { en: 'GMAT', bn: 'জিম্যাট' },
  medical: { en: 'Medical', bn: 'মেডিকেল' },
  engineering: { en: 'Engineering', bn: 'ইঞ্জিনিয়ারিং' },
}

/** Normalised key for a focus tag, e.g. "University admission" -> "university-admission". */
export const focusKey = (focus) => String(focus || '').trim().toLowerCase()

/** Bilingual label for a focus tag (falls back to the raw dataset text). */
export function focusLabel(focus, lang = 'en') {
  const entry = FOCUS_LABELS[focusKey(focus)]
  if (entry) return entry[lang] ?? entry.en
  return String(focus || '')
}

/** One platform, normalised for the UI (no null-checks left for components). */
const normalise = (center) => {
  const sources = Array.isArray(center.source_urls) ? center.source_urls.filter(Boolean) : []
  const site = center.platform_link || null
  return {
    id: String(center.id ?? center.name),
    name: center.name || '',
    focus: Array.isArray(center.focus) ? center.focus.filter(Boolean) : [],
    // A percentage from the dataset (today: sample values, see
    // successRatesAreSample), or null when the center publishes none.
    successRate: typeof center.success_rate_percent === 'number' ? center.success_rate_percent : null,
    successRateNote: center.success_rate_note || '',
    site,
    // When the center publishes no site, the dataset carries a search link so the
    // student can still reach it instead of hitting a dead end.
    discoveryUrl: site ? null : center.platform_discovery_link || null,
    siteNote: center.platform_link_note || '',
    location: center.physical_location || '',
    teachers: Array.isArray(center.teachers) ? center.teachers.filter(Boolean) : [],
    teacherNote: center.teacher_names_note || '',
    resultClaims: Array.isArray(center.public_result_claims) ? center.public_result_claims : [],
    sources,
  }
}

/** All platforms, in dataset order. */
export const platforms = (dataset.coaching_centers || []).map(normalise)

/** Every focus tag that appears in the dataset, in first-seen order. */
export const allFocus = [...new Set(platforms.flatMap((p) => p.focus))]

/** Platforms with an official site, used for the summary line. */
export const withSiteCount = platforms.filter((p) => p.site).length
