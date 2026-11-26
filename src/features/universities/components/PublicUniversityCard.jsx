import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocale } from '@/hooks/useLocale'
import { formatDate, daysUntil, formatBDT } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'

/** One label + value pair in the fact sheet. */
function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums text-slate-900">{children}</dd>
    </div>
  )
}

/** Card for a public university on the hub grid (FR-2). Reads like a prospectus entry. */
export function PublicUniversityCard({ university: u }) {
  const { t } = useTranslation()
  const { loc, lang } = useLocale()

  const days = daysUntil(u.deadline)
  const urgent = days != null && days >= 0 && days <= 14

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
      <header>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-medium leading-snug text-slate-900">{loc(u.name)}</h3>
          <span className="shrink-0 text-xs text-slate-400">{loc(u.shortName)}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {loc(u.city)} · {t('universities.established')} {u.established}
        </p>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
        {u.seatsTotal != null && (
          <Fact label={t('common.seats')}>{u.seatsTotal.toLocaleString('en-IN')}</Fact>
        )}
        {u.applicationFee != null && <Fact label={t('common.fee')}>৳{u.applicationFee}</Fact>}
        {u.examPattern && <Fact label={t('universities.filterPattern')}>{u.examPattern}</Fact>}
        {u.groups?.length > 0 && (
          <Fact label={t('universities.filterGroup')}>
            {u.groups.map((g) => t(`profile.groups.${g}`)).join(', ')}
          </Fact>
        )}
      </dl>

      {u.costMin != null && (
        <div className="mt-5 border-t border-slate-200/70 pt-4">
          <p className="text-xs text-slate-500">{t('universities.estimatedDegreeCost')}</p>
          <p className="mt-0.5 text-sm font-medium tabular-nums text-slate-900">
            {u.costMin === u.costMax
              ? formatBDT(u.costMin)
              : `${formatBDT(u.costMin)} – ${formatBDT(u.costMax)}`}
          </p>
        </div>
      )}

      {u.deadline && (
        <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-slate-600">
          <span>
            {t('common.deadline')}:{' '}
            <span className="font-medium text-slate-900">{formatDate(u.deadline, lang)}</span>
          </span>
          {days != null && days >= 0 && (
            <span className={urgent ? 'font-medium text-rose-700' : 'text-slate-500'}>
              {days === 0 ? t('common.daysLeftToday') : t('common.daysLeft', { count: days })}
            </span>
          )}
        </p>
      )}

      <div className="flex-1" />

      {/* footer: details left, provenance right (FR-4: source + last verified) */}
      <footer className="mt-5 flex items-end justify-between gap-3 border-t border-slate-200/70 pt-4">
        <Link
          to={route(ROUTES.publicUniversityDetail, { id: u.id })}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
        >
          {t('common.details')}
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
        <div className="text-right text-xs leading-relaxed text-slate-500">
          {u.sourceUrl && (
            <a
              href={u.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-brand-700"
            >
              {t('universities.source')}
            </a>
          )}
          {u.lastVerified && (
            <span className="block">
              {t('universities.verifiedOn')} {formatDate(u.lastVerified, lang)}
            </span>
          )}
        </div>
      </footer>
    </article>
  )
}
