import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Building2, SearchX, Search } from 'lucide-react'
import { usePrivateUniversities } from '../hooks/useUniversities'
import { PrivateUniversityCard, DepartmentCard } from '../components/PrivateUniversityCard'
import { SortSelect, CompareBar } from '../components/PublicFilters'
import { Card } from '@/components/ui/Card'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { useDebounce } from '@/hooks/useDebounce'
import { useLocale } from '@/hooks/useLocale'
import { useCompareStore } from '@/store/compareStore'
import { DEPARTMENT_NAMES } from '@/lib/constants'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button } from '@/components/ui/Button'

/**
 * FR-3 — Private university directory.
 * - toggle "by university" / "by department"
 * - sort by total cost / tuition / waiver rules
 * - side-by-side compare (2-3 universities) via compare store
 */
export default function PrivateDirectoryPage() {
  useDocumentTitle('nav.privateUniversities')
  const { t } = useTranslation()
  const { loc } = useLocale()
  const navigate = useNavigate()
  const { data: universities = [], isLoading } = usePrivateUniversities()

  const [view, setView] = useState('byUniversity') // byUniversity | byDepartment
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 250)
  const [deptFilter, setDeptFilter] = useState('all')
  const [sort, setSort] = useState('costAsc')

  const compareIds = useCompareStore((s) => s.ids)
  const toggleCompare = useCompareStore((s) => s.toggle)
  const clearCompare = useCompareStore((s) => s.clear)

  // ----- by-university list -----
  const uniList = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    let list = universities.filter((u) => {
      if (!q) return true
      const hay = [loc(u.name), loc(u.shortName), loc(u.city)].join(' ').toLowerCase()
      return hay.includes(q)
    })
    const minCost = (u) => Math.min(...u.departments.map((d) => d.totalCost))
    const maxWaiver = (u) => Math.max(0, ...u.departments.map((d) => d.maxWaiverPct || 0))
    list = [...list].sort((a, b) => {
      if (sort === 'costAsc') return minCost(a) - minCost(b)
      if (sort === 'costDesc') return minCost(b) - minCost(a)
      if (sort === 'waiver') return maxWaiver(b) - maxWaiver(a)
      if (sort === 'name') return loc(a.name).localeCompare(loc(b.name))
      return 0
    })
    return list
  }, [universities, debounced, sort, loc])

  // ----- by-department flat list -----
  const deptList = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    let rows = []
    for (const u of universities) {
      for (const d of u.departments) {
        if (deptFilter !== 'all' && d.dept !== deptFilter) continue
        if (q) {
          const hay = [loc(d.name), loc(u.name), t(`profile.subjects.${d.dept}`)]
            .join(' ')
            .toLowerCase()
          if (!hay.includes(q)) continue
        }
        rows.push({ u, d })
      }
    }
    rows = rows.sort((a, b) => {
      if (sort === 'costAsc') return a.d.totalCost - b.d.totalCost
      if (sort === 'costDesc') return b.d.totalCost - a.d.totalCost
      if (sort === 'tuition') return a.d.tuitionPerCredit - b.d.tuitionPerCredit
      if (sort === 'waiver') return (b.d.maxWaiverPct || 0) - (a.d.maxWaiverPct || 0)
      return 0
    })
    return rows
  }, [universities, debounced, deptFilter, sort, loc, t])

  const handleCompare = (id) => {
    const result = toggleCompare(id)
    if (result === 'max') toast.error(t('universities.compareMax'))
  }

  const uniSortOptions =
    view === 'byUniversity'
      ? [
          { value: 'costAsc', label: t('universities.sortTotalCost') },
          { value: 'costDesc', label: t('universities.sortTotalCostDesc') },
          { value: 'waiver', label: t('universities.sortWaiver') },
          { value: 'name', label: t('universities.sortName') },
        ]
      : [
          { value: 'costAsc', label: t('universities.sortTotalCost') },
          { value: 'costDesc', label: t('universities.sortTotalCostDesc') },
          { value: 'tuition', label: t('universities.sortTuition') },
          { value: 'waiver', label: t('universities.sortWaiver') },
        ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Building2 className="h-5 w-5 text-brand-600" />
          {t('universities.privateTitle')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('universities.privateSubtitle')}</p>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* view toggle byUniversity / byDepartment */}
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
          <button
            onClick={() => setView('byUniversity')}
            className={`px-3 py-1.5 text-sm font-medium ${
              view === 'byUniversity' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t('universities.viewByUniversity')}
          </button>
          <button
            onClick={() => setView('byDepartment')}
            className={`px-3 py-1.5 text-sm font-medium ${
              view === 'byDepartment' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t('universities.viewByDepartment')}
          </button>
        </div>

        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              view === 'byUniversity'
                ? t('universities.searchPlaceholder')
                : t('universities.searchPlaceholderDept')
            }
            className="pl-9"
          />
        </div>

        {view === 'byDepartment' && (
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('universities.allDepartments')}</SelectItem>
              {Object.keys(DEPARTMENT_NAMES).map((d) => (
                <SelectItem key={d} value={d}>
                  {t(`profile.subjects.${d}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <SortSelect value={sort} onChange={setSort} options={uniSortOptions} />
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : view === 'byUniversity' ? (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {t('common.resultsCount', { count: uniList.length })}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {uniList.map((u) => (
              <PrivateUniversityCard key={u.id} university={u} />
            ))}
          </div>
          {uniList.length === 0 && (
            <Card>
              <EmptyState
                icon={SearchX}
                title={t('universities.noResults')}
                description={t('universities.noResultsDesc')}
              />
            </Card>
          )}
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {t('common.resultsCount', { count: deptList.length })}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {deptList.map(({ u, d }) => (
              <div key={d.id} className="flex gap-3">
                <div className="flex-1">
                  <DepartmentCard university={u} dept={d} showUniversity />
                </div>
                <Button
                  variant={compareIds.includes(u.id) ? 'default' : 'outline'}
                  size="sm"
                  className="mt-1 shrink-0"
                  onClick={() => handleCompare(u.id)}
                  title={t('universities.compare')}
                >
                  {compareIds.includes(u.id) ? '✓' : '+'}
                </Button>
              </div>
            ))}
          </div>
          {deptList.length === 0 && (
            <Card>
              <EmptyState
                icon={SearchX}
                title={t('universities.noResults')}
                description={t('universities.noResultsDesc')}
              />
            </Card>
          )}
        </>
      )}

      {/* floating compare bar (FR-3: side-by-side compare entry point) */}
      <CompareBar
        count={compareIds.length}
        onClear={clearCompare}
        onGo={() => navigate(ROUTES.compare)}
      />
    </div>
  )
}
