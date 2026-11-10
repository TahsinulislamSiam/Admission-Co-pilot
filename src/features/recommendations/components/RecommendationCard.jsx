import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, CalendarDays, Landmark, Building2, CheckCircle2, TrendingUp, Ban } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'
import { formatBDT, formatDate } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'
import { cn } from '@/lib/utils'
import { SourceLink, VerifiedBadge } from '@/components/common/SourceLink'

const eligibilityVariant = {
  eligible: 'success',
  stretch: 'warning',
  ineligible: 'danger',
}

/**
 * AI-4 — one recommendation card:
 * university-department, match score, reasons, total cost, eligibility badge.
 */
export function RecommendationCard({ item }) {
  const { t } = useTranslation()
  const { loc, lang } = useLocale()

  const detailRoute =
    item.kind === 'public'
      ? route(ROUTES.publicUniversityDetail, { id: item.universityId })
      : route(ROUTES.privateUniversityDetail, { id: item.universityId })

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-card-hover">
      {/* match score ribbon */}
      <div
        className="absolute right-0 top-0 rounded-bl-xl bg-brand-600 px-3 py-1.5 text-sm font-bold text-white"
        title={t('recommendations.match')}
      >
        {item.matchScore}%
      </div>

      <CardContent>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            {item.kind === 'public' ? (
              <Landmark className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            ) : (
              <Building2 className="h-[18px] w-[18px]" />
            )}
          </span>
          <div className="min-w-0 pr-14">
            <Link
              to={detailRoute}
              className="block truncate text-sm font-semibold text-slate-800 hover:text-brand-700"
            >
              {loc(item.university)}
            </Link>
            <p className="truncate text-xs text-slate-500">{loc(item.department)}</p>
          </div>
        </div>

        {/* badges row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={eligibilityVariant[item.eligibility]}>
            {item.eligibility === 'eligible' && <CheckCircle2 className="h-3 w-3" />}
            {item.eligibility === 'stretch' && <TrendingUp className="h-3 w-3" />}
            {item.eligibility === 'ineligible' && <Ban className="h-3 w-3" />}
            {t(`recommendations.${item.eligibility}`)}
          </Badge>
          <Badge variant="outline">
            {item.kind === 'public'
              ? t('recommendations.publicTag')
              : t('recommendations.privateTag')}
          </Badge>
          {item.waiverPct > 0 && (
            <Badge variant="brand">
              {item.waiverPct}% {t('universities.table.waiver')}
            </Badge>
          )}
        </div>

        {/* cost + city + deadline */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-center">
          <div>
            <p className="text-sm font-bold text-slate-900">{formatBDT(item.totalCost)}</p>
            <p className="text-[11px] text-slate-400">{t('recommendations.totalCost')}</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1 text-sm font-medium text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-brand-600" />
              {loc(item.city)}
            </p>
            <p className="text-[11px] text-slate-400">{t('common.city')}</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1 text-sm font-medium text-slate-700">
              <CalendarDays className="h-3.5 w-3.5 text-brand-600" />
              {formatDate(item.deadline, lang)}
            </p>
            <p className="text-[11px] text-slate-400">{t('common.deadline')}</p>
          </div>
        </div>

        {/* match reasons */}
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Sparkles className="h-3 w-3 text-accent-500" />
            {t('recommendations.matchReason')}
          </p>
          <ul className="space-y-1">
            {item.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {loc(r)}
              </li>
            ))}
          </ul>
        </div>

        {/* FR-4 on recommendation cards too */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SourceLink url={item.sourceUrl} compact />
          <VerifiedBadge date={item.lastVerified} />
        </div>

        <div className="mt-4">
          <Link to={detailRoute}>
            <Button variant="secondary" size="sm" className="w-full">
              {t('recommendations.viewDetails')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

/** Budget / GPA / group filter bar for the recommendations page. */
export function RecommendationFilters({ value, onChange }) {
  const { t } = useTranslation()

  const budgetSteps = [500000, 800000, 1000000, 1500000, Infinity]

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-4 py-4">
        {/* budget */}
        <div className="min-w-[220px] flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">{t('recommendations.filterBudget')}</span>
            <span className="font-bold text-brand-700">
              {value.budget === Infinity ? '∞' : formatBDT(value.budget)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={budgetSteps.length - 1}
            step="1"
            value={value.budgetIndex}
            onChange={(e) => {
              const idx = Number(e.target.value)
              onChange({ ...value, budget: budgetSteps[idx], budgetIndex: idx })
            }}
            className="w-full accent-brand-600"
          />
        </div>

        {/* min GPA */}
        <div className="min-w-[200px]">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">{t('recommendations.filterMinGpa')}</span>
            <span className="font-bold text-brand-700">{value.minGpa.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="2"
            max="5"
            step="0.25"
            value={value.minGpa}
            onChange={(e) => onChange({ ...value, minGpa: Number(e.target.value) })}
            className="w-full accent-brand-600"
          />
        </div>

        {/* sort */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">
            {t('recommendations.filterSort')}
          </span>
          <div className="flex rounded-lg border border-slate-300 p-0.5">
            {[
              { v: 'match', l: t('recommendations.sortMatch') },
              { v: 'cost', l: t('recommendations.sortCost') },
              { v: 'deadline', l: t('recommendations.sortDeadline') },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => onChange({ ...value, sort: o.v })}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium',
                  value.sort === o.v ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
