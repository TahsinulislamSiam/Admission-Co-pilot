import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Sparkles, SearchX, UserRoundCog } from 'lucide-react'
import { useRecommendations } from '../hooks/useRecommendations'
import { RecommendationCard, RecommendationFilters } from '../components/RecommendationCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { daysUntil } from '@/lib/utils'

/**
 * AI-4 — up to 10 university-department recommendations with
 * match reasons, total cost, eligibility badge and a budget/GPA filter bar.
 */
export default function RecommendationsPage() {
  useDocumentTitle('nav.recommendations')
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.user?.profile)
  const { data: items, isLoading, isError, error } = useRecommendations()

  const [filters, setFilters] = useState({
    budget: Infinity,
    budgetIndex: 4,
    minGpa: 0,
    sort: 'match',
  })

  const incomplete = isError && error?.message === 'profileIncomplete'

  const visible = useMemo(() => {
    if (!items) return []
    let list = items.filter((it) => {
      if (filters.budget !== Infinity && it.totalCost > filters.budget) return false
      return true
    })
    // GPA filter applies to private deptKey options & eligibility sanity
    if (filters.minGpa > 0 && profile?.hscGpa != null && filters.minGpa > profile.hscGpa) {
      // filter shows what WOULD be possible at that GPA — hide clearly ineligible
      list = list.filter((it) => it.eligibility !== 'ineligible')
    }
    list = [...list].sort((a, b) => {
      if (filters.sort === 'cost') return a.totalCost - b.totalCost
      if (filters.sort === 'deadline') {
        const da = daysUntil(a.deadline) ?? 9999
        const db = daysUntil(b.deadline) ?? 9999
        return da - db
      }
      return b.matchScore - a.matchScore
    })
    return list
  }, [items, filters, profile])

  if (incomplete || (!profile?.hscGpa && !isLoading)) {
    return (
      <Card>
        <EmptyState
          icon={UserRoundCog}
          title={t('recommendations.profileIncomplete')}
          description={t('recommendations.profileIncompleteDesc')}
          action={
            <Link to={ROUTES.profile}>
              <Button>
                {t('recommendations.updateProfile')}
              </Button>
            </Link>
          }
        />
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Sparkles className="h-5 w-5 text-brand-600" />
          {t('recommendations.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('recommendations.subtitle')}</p>
        {/* profile summary chip */}
        <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800">
          {t('recommendations.basedOnProfile')}:
          <span className="rounded bg-white px-1.5 py-0.5">
            HSC {profile?.hscGpa?.toFixed(2)} · SSC {profile?.sscGpa?.toFixed(2)}
          </span>
          <span className="rounded bg-white px-1.5 py-0.5">
            {t(`profile.groups.${profile?.group}`)}
          </span>
          {profile?.budget != null && (
            <span className="rounded bg-white px-1.5 py-0.5">
              {t('profile.budget')}: ৳{profile.budget.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      <RecommendationFilters value={filters} onChange={setFilters} />

      {isLoading ? (
        <SkeletonList count={4} className="h-64" />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title={t('recommendations.noResults')}
            description={t('recommendations.noResultsDesc')}
          />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.slice(0, 10).map((item, i) => (
            <RecommendationCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
