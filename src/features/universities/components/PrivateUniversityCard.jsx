import { useTranslation } from 'react-i18next'
import { Building2, MapPin, Wallet, Layers, Check, Scale, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SourceLink, VerifiedBadge } from '@/components/common/SourceLink'
import { useLocale } from '@/hooks/useLocale'
import { formatBDT } from '@/lib/utils'
import { useCompareStore } from '@/store/compareStore'
import { ROUTES, route } from '@/routes/constants'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

/** Private university card (FR-3) with compare toggle + lowest cost + max waiver. */
export function PrivateUniversityCard({ university: u }) {
  const { t } = useTranslation()
  const { loc } = useLocale()
  const compareIds = useCompareStore((s) => s.ids)
  const toggleCompare = useCompareStore((s) => s.toggle)
  const inCompare = compareIds.includes(u.id)

  const minCost = Math.min(...u.departments.map((d) => d.costMin ?? d.totalCost))
  const maxCost = Math.max(...u.departments.map((d) => d.costMax ?? d.totalCost))
  const formatRange = (min, max) =>
    min === max ? formatBDT(min) : `${formatBDT(min)} – ${formatBDT(max)}`

  const handleCompare = () => {
    const result = toggleCompare(u.id)
    if (result === 'max') toast.error(t('universities.compareMax'))
  }

  return (
    <Card className={cn('flex h-full flex-col transition-shadow hover:shadow-card-hover', inCompare && 'ring-2 ring-brand-500')}>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={route(ROUTES.privateUniversityDetail, { id: u.id })}
              className="block truncate text-base font-semibold text-slate-800 hover:text-brand-700"
            >
              {loc(u.name)}
            </Link>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {u.location || loc(u.city)}
            </p>
          </div>
          <Badge variant="brand">{loc(u.shortName)}</Badge>
        </div>

        {/* key numbers */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 px-2 py-2.5">
            <Layers className="mx-auto h-4 w-4 text-brand-600" />
            <p className="mt-1 text-sm font-semibold text-slate-800">{u.departments.length}</p>
            <p className="text-[11px] text-slate-400">{t('universities.departmentCount', { count: '' })}</p>
          </div>
          <div className="col-span-2 rounded-lg bg-slate-50 px-2 py-2.5">
            <Wallet className="mx-auto h-4 w-4 text-brand-600" />
            <p className="mt-1 text-sm font-semibold text-slate-800">{formatRange(minCost, maxCost)}</p>
            <p className="text-[11px] text-slate-400">{t('universities.estimatedDegreeCost')}</p>
          </div>
        </div>

        {/* shortlist rank */}
        {u.rank && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Trophy className="h-3 w-3 text-amber-500" />
            {t('universities.shortlistRank', { rank: u.rank })}
          </p>
        )}

        {/* FR-4 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SourceLink url={u.sourceUrl} compact />
          <VerifiedBadge date={u.lastVerified} />
        </div>

        <div className="mt-4 flex-1" />

        <div className="mt-4 flex gap-2">
          <Link to={route(ROUTES.privateUniversityDetail, { id: u.id })} className="flex-1">
            <Button variant="secondary" className="w-full">
              {t('common.details')}
            </Button>
          </Link>
          <Button
            variant={inCompare ? 'default' : 'outline'}
            onClick={handleCompare}
            title={t('universities.compare')}
          >
            {inCompare ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
            <span className="hidden sm:inline">{t('universities.compare')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** One department row used in "by department" view + compare page. */
export function DepartmentCard({ university: u, dept: d, showUniversity = false }) {
  const { t } = useTranslation()
  const { loc } = useLocale()

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {showUniversity && (
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-brand-700">
              <Building2 className="h-3 w-3" />
              {loc(u.shortName)}
            </p>
          )}
          <h3 className="text-sm font-semibold text-slate-800">{loc(d.name)}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            {u ? u.name.en : ''}
            {d.basis && (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                {t('universities.estimate')}
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">
            {d.costMin === d.costMax ? formatBDT(d.costMin) : `${formatBDT(d.costMin)} – ${formatBDT(d.costMax)}`}
          </p>
          <p className="text-[11px] text-slate-400">{t('universities.estimatedDegreeCost')}</p>
        </div>
      </div>

      {/* cost scope note from the dataset */}
      {d.includes && <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{d.includes}</p>}
    </Card>
  )
}
