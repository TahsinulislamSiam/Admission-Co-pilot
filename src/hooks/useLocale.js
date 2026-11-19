import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Bilingual helper hook for seed data.
 * Returns loc() bound to the active language, e.g. `loc(u.name)`.
 */
export function useLocale() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'bn'
  // Memoized: components list `loc` in hook deps, so its identity must be stable
  // (an unstable `loc` made the public-universities page re-render forever)
  const loc = useCallback((field) => {
    if (field == null) return ''
    if (typeof field === 'string' || typeof field === 'number') return field
    return field[lang] ?? field.en ?? field.bn ?? ''
  }, [lang])
  return { lang, loc, isBn: lang === 'bn' }
}
