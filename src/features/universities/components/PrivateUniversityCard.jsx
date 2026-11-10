import { useTranslation } from 'react-i18next'
import { Building2, MapPin, Wallet, GraduationCap, Check, Scale, BadgePercent } from 'lucide-react'
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

  const costs = u.departments.map((d) => d.totalCost)
  const minCost = Math.min(...costs)
  const maxWaiver = Math.max(0, ...u.departments.map((d) => d.maxWaiverPct || 0))

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
              {loc(u.city)} · {t('universities.established')} {u.established}
            </p>
          </div>
          <Badge variant="brand">{loc(u.shortName)}</Badge>
        </div>

        {/* key numbers */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 px-2 py-2.5">
            <GraduationCap className="mx-auto h-4 w-4 text-brand-600" />
            <p className="mt-1 text-sm font-semibold text-slate-800">{u.departments.length}</p>
            <p className="text-[11px] text-slate-400">{t('universities.departmentCount', { count: '' })}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-2.5">
            <Wallet className="mx-auto h-4 w-4 text-brand-600" />
            <p className="mt-1 text-sm font-semibold text-slate-800">{formatBDT(minCost)}</p>
            <p className="text-[11px] text-slate-400">{t('universities.minTotalCost')}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-2.5">
            <BadgePercent className="mx-auto h-4 w-4 text-brand-600" />
            <p className="mt-1 text-sm font-semibold text-slate-800">{maxWaiver}%</p>
            <p className="text-[11px] text-slate-400">{t('universities.maxWaiver', { pct: '' })}</p>
          </div>
        </div>

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
          <p className="mt-1 text-xs text-slate-400">
            {t('profile.subjects.' + d.dept)} · {d.credits} {t('universities.credits')} ·{' '}
            {d.seats} {t('common.seats')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">{formatBDT(d.totalCost)}</p>
          <p className="text-[11px] text-slate-400">{t('universities.totalCost')}</p>
        </div>
      </div>

      {/* tuition breakdown */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs">
        <div>
          <p className="font-semibold text-slate-700">{formatBDT(d.tuitionPerCredit)}</p>
          <p className="text-slate-400">{t('universities.tuitionPerCredit')}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-700">{d.credits}</p>
          <p className="text-slate-400">{t('universities.credits')}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-700">{d.maxWaiverPct ? `${d.maxWaiverPct}%` : '—'}</p>
          <p className="text-slate-400">{t('universities.table.waiver')}</p>
        </div>
      </div>
    </Card>
  )
}
