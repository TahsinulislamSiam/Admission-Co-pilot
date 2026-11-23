import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Newspaper, RefreshCw, ExternalLink, Clock, Globe2, AlertCircle } from 'lucide-react'
import { useNews, useNewsPapers } from '../hooks/useNews'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'

/** "5 minutes ago" in the reader's own language, without hand-written copy. */
const useRelativeTime = () => {
  const { i18n } = useTranslation()
  return (iso) => {
    if (!iso) return ''
    const diffMs = new Date(iso).getTime() - Date.now()
    if (Number.isNaN(diffMs)) return ''
    const units = [
      ['year', 365 * 24 * 3600],
      ['month', 30 * 24 * 3600],
      ['day', 24 * 3600],
      ['hour', 3600],
      ['minute', 60],
    ]
    let value = Math.round(diffMs / 1000)
    for (const [unit, secs] of units) {
      if (Math.abs(value) >= secs) {
        value = Math.round(value / secs)
        try {
          return new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' }).format(value, unit)
        } catch {
          return ''
        }
      }
    }
    return new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' }).format(value, 'second')
  }
}

const SCOPES = ['all', 'national', 'international']

/** Thumbnail with a branded fallback: many Bangla feeds ship no image. */
function Thumb({ src, accent, className }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400',
          className
        )}
        style={accent ? { backgroundImage: `linear-gradient(135deg, ${accent}22, ${accent}44)` } : undefined}
        aria-hidden="true"
      >
        <Newspaper className="h-6 w-6" style={accent ? { color: accent } : undefined} />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={cn('object-cover', className)}
    />
  )
}

/**
 * Newspaper section: national headlines (Prothom Alo, Daily Star, Jago News) and
 * international ones (BBC, DW), refreshed automatically from the publishers' RSS.
 * The two featured papers sit on top as link cards with a real thumbnail.
 */
export function NewspaperPage() {
  const { t } = useTranslation()
  const [scope, setScope] = useState('all')
  const relative = useRelativeTime()

  useDocumentTitle(t('newspaper.title'))

  const { data: papers = [], isLoading: papersLoading } = useNewsPapers()
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useNews(scope)

  const items = data?.items ?? []
  const counts = data?.counts ?? { national: 0, international: 0 }

  const scopeLabel = useMemo(
    () => ({
      all: t('newspaper.all'),
      national: t('newspaper.national'),
      international: t('newspaper.international'),
    }),
    [t]
  )

  const updatedLabel = data?.updatedAt ? relative(new Date(data.updatedAt).toISOString()) : null

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- head */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Newspaper className="h-6 w-6 text-brand-600" />
            {t('newspaper.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('newspaper.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {updatedLabel && (
            <span className="hidden items-center gap-1 text-xs text-slate-400 sm:flex">
              <Clock className="h-3.5 w-3.5" />
              {t('newspaper.updated', { when: updatedLabel })}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            {t('newspaper.refresh')}
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------ papers */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-800">{t('newspaper.papersTitle')}</h2>
          <p className="text-xs text-slate-500">{t('newspaper.papersSubtitle')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {papersLoading
            ? [0, 1].map((i) => (
                <Card key={i}>
                  <div className="h-40 animate-pulse rounded-t-xl bg-slate-100" />
                  <CardContent className="space-y-2 p-4">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
                  </CardContent>
                </Card>
              ))
            : papers.map((paper) => (
                <Card key={paper.id} className="overflow-hidden">
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <Thumb
                      src={paper.thumbnail}
                      accent={paper.accent}
                      className="h-40 w-full"
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{paper.name?.en}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                          {t('newspaper.visitSite')}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      {paper.headline ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{paper.headline}</p>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">{paper.url}</p>
                      )}
                    </CardContent>
                  </a>
                </Card>
              ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- filters */}
      <div className="flex flex-wrap items-center gap-2">
        {SCOPES.map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={scope === s ? 'default' : 'outline'}
            className="rounded-full"
            onClick={() => setScope(s)}
          >
            {s === 'all' ? <Globe2 className="h-4 w-4" /> : null}
            {scopeLabel[s]}
            {s !== 'all' && counts[s] > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[11px]">{counts[s]}</span>
            )}
          </Button>
        ))}
      </div>

      {/* ---------------------------------------------------------------- feed */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <Card>
          <EmptyState
            icon={AlertCircle}
            title={t('newspaper.errorTitle')}
            description={t('newspaper.errorBody')}
          />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Newspaper}
            title={t('newspaper.emptyTitle')}
            description={t('newspaper.emptyBody')}
          />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="h-full overflow-hidden">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Thumb src={item.image} className="h-36 w-full" />
                  <CardContent className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.source.scope === 'national' ? 'success' : 'purple'}>
                        {scopeLabel[item.source.scope]}
                      </Badge>
                      <span className="text-[11px] font-medium text-slate-500">
                        {item.source.name?.en}
                      </span>
                      {item.publishedAt && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {relative(item.publishedAt)}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-3 font-semibold leading-snug text-slate-800">
                      {item.title}
                    </p>
                    {item.summary && (
                      <p className="line-clamp-2 text-xs text-slate-500">{item.summary}</p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-brand-600">
                      {t('newspaper.readMore')}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </a>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-[11px] text-slate-400">{t('newspaper.disclaimer')}</p>
    </div>
  )
}

export default NewspaperPage
