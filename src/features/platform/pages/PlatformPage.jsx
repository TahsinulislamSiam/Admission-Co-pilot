import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, SearchX, Search, Info } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { useLocale } from '@/hooks/useLocale'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import { PlatformCard } from '../components/PlatformCard'
import { allFocus, datasetMeta, focusLabel, platforms } from '../platformData'

/**
 * Platform — coaching / admission platforms in Bangladesh.
 *
 * A research directory, not a ranking: every card shows its own focus areas and
 * location, links to the platform's official site (or a discovery search when it
 * publishes none), and keeps the dataset's honesty notes about unverified
 * success rates visible instead of inventing numbers.
 */
export default function PlatformPage() {
  useDocumentTitle('nav.platform')
  const { t } = useTranslation()
  const { lang } = useLocale()
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState('all')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return platforms.filter((p) => {
      if (focus !== 'all' && !p.focus.includes(focus)) return false
      if (!q) return true
      const haystack = [
        p.name,
        p.location,
        ...p.focus,
        ...p.focus.map((f) => focusLabel(f, lang)),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query, focus, lang])

  return (
    <div>
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Layers className="h-5 w-5 text-brand-600" />
          {t('platform.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('platform.subtitle')}</p>
      </div>

      {datasetMeta.notes.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <Info className="h-4 w-4" aria-hidden />
            {t('platform.noticeTitle')}
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-amber-800/90">
            {datasetMeta.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('platform.searchPlaceholder')}
            aria-label={t('platform.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-slate-500">
          {t('platform.count', { shown: results.length, total: platforms.length })}
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFocus('all')}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            focus === 'all'
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          {t('platform.allFocus')}
        </button>
        {allFocus.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFocus(f)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              focus === f
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {focusLabel(f, lang)}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t('platform.emptyTitle')}
          description={t('platform.emptyDesc')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => (
            <PlatformCard key={p.id} platform={p} lang={lang} />
          ))}
        </div>
      )}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
        <Badge variant="outline">{datasetMeta.country}</Badge>
        {t('platform.datasetMeta', { date: datasetMeta.createdAt })}
      </p>
    </div>
  )
}
