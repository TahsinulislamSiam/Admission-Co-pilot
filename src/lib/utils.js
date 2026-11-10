import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely (shadcn-style helper) */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Pick the localized value of a bilingual seed-data field.
 * Accepts either a plain string or an { en, bn } object.
 */
export function localize(field, lang) {
  if (field == null) return ''
  if (typeof field === 'string' || typeof field === 'number') return field
  return field[lang] ?? field.en ?? field.bn ?? ''
}

/** Localize against current i18n language (convenience wrapper) */
export function loc(field, i18nLanguage) {
  return localize(field, i18nLanguage === 'bn' ? 'bn' : 'en')
}

/** Format a number as Bangladeshi Taka with lakh grouping, e.g. ৳9,45,000 */
export function formatBDT(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return `৳${Number(amount).toLocaleString('en-IN')}`
}

/** Format an ISO date for the active language (bn-BD / en-GB) */
export function formatDate(iso, lang = 'bn') {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** Whole days between now and an ISO date (negative = past). */
export function daysUntil(iso) {
  if (!iso) return null
  const diff = new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.round(diff / 86400000)
}

/** Format seconds as mm:ss (test engine timer). */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Format seconds as a human duration, e.g. "১২ মি ৩০ সে" (bn) / "12m 30s" (en). */
export function formatDuration(totalSeconds, lang = 'bn') {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const rest = s % 60
  if (lang === 'bn') return `${m} মি ${rest} সে`
  return `${m}m ${rest}s`
}

/** Clamp helper for sliders / scores */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

/** Percent 0-100 rounded */
export const pct = (num, den) => (den === 0 ? 0 : Math.round((num / den) * 100))
