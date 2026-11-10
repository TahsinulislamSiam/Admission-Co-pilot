import { useTranslation } from 'react-i18next'
import { CalendarClock, Users, MapPin, Banknote, ClipboardList, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SourceLink, VerifiedBadge } from '@/components/common/SourceLink'
import { useLocale } from '@/hooks/useLocale'
import { formatDate, daysUntil } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'

/** Card for a public university on the hub grid (FR-2). */
export function PublicUniversityCard({ university: u }) {
  const { t } = useTranslation()
  const { loc, lang } = useLocale()

  const days = daysUntil(u.deadline)
  const deadlineTone =
    days == null
      ? 'default'
      : days < 0
        ? 'danger'
        : days <= 14
          ? 'warning'
          : 'success'

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-card-hover">
      <CardContent className="flex flex-1 flex-col">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-800">{loc(u.name)}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {loc(u.city)} · {t('universities.established')} {u.established}
            </p>
          </div>
          <Badge variant="brand">{loc(u.shortName)}</Badge>
        </div>

        {/* key numbers */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="h-4 w-4 text-brand-600" />
            <span className="font-semibold text-slate-800">{u.seatsTotal.toLocaleString('en-IN')}</span>
            <span className="text-xs">{t('common.seats')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Banknote className="h-4 w-4 text-brand-600" />
            <span className="font-semibold text-slate-800">৳{u.applicationFee}</span>
            <span className="text-xs">{t('common.fee')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <ClipboardList className="h-4 w-4 text-brand-600" />
            <span className="text-xs">{u.examPattern}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Layers className="h-4 w-4 text-brand-600" />
            <span className="text-xs">
              {u.groups.map((g) => t(`profile.groups.${g}`)).join(', ')}
            </span>
          </div>
        </div>

        {/* deadline */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock className="h-3.5 w-3.5" />
            {t('common.deadline')}: {formatDate(u.deadline, lang)}
          </span>
          {days != null && days >= 0 && (
            <Badge variant={deadlineTone}>
              {days === 0 ? t('common.daysLeftToday') : t('common.daysLeft', { count: days })}
            </Badge>
          )}
        </div>

        {/* FR-4: source + last verified on every record */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SourceLink url={u.sourceUrl} compact label={t('universities.source')} />
          <VerifiedBadge date={u.lastVerified} />
        </div>

        <div className="mt-4 flex-1" />

        <div className="mt-4">
          <Link to={route(ROUTES.publicUniversityDetail, { id: u.id })}>
            <Button variant="secondary" className="w-full">
              {t('common.details')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
