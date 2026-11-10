import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/** Set the browser tab title for the active page. */
export function useDocumentTitle(key, vars = {}) {
  const { t } = useTranslation()
  const serializedVars = JSON.stringify(vars)
  useEffect(() => {
    const title = t(key, JSON.parse(serializedVars))
    if (title) document.title = `${title} · ${t('common.appName')}`
  }, [key, t, serializedVars])
}
