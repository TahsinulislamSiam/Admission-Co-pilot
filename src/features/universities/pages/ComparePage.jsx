import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Scale, X } from 'lucide-react'
import { usePrivateUniversities } from '../hooks/useUniversities'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { useLocale } from '@/hooks/useLocale'
import { formatBDT, formatDate, cn } from '@/lib/utils'
import { useCompareStore } from '@/store/compareStore'
import { ROUTES, route } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/**
 * FR-3 — Side-by-side comparison of 2–3 private universities.
 * The cheapest value in each row is highlighted, and each programme row
 * carries a thin bar so differences can be seen without reading numbers.
 */
export default function ComparePage() {
  useDocumentTitle('nav.compare')
  const { t } = useTranslation()
  const { loc, lang } = useLocale()
  const { data: universities = [], isLoading } = usePrivateUniversities()

  const compareIds = useCompareStore((s) => s.ids)
  const remove = useCompareStore((s) => s.remove)

  const selected = universities.filter((u) => compareIds.includes(u.id))

  if (isLoading) return <PageLoader />

  if (selected.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Scale}
          title={t('universities.compareEmpty')}
          description={t('universities.compareEmptyDesc')}
          action={
            <Link to={ROUTES.privateUniversities}>
              <Button>{t('universities.browseUniversities')}</Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const allDepts = [...new Set(selected.flatMap((u) => u.departments.map((d) => d.name.en)))]
  const deptCost = (u, deptKey) => {
    const d = u.departments.find((x) => x.name.en === deptKey)
    return d ? { min: d.costMin, max: d.costMax, mid: d.totalCost } : null
  }
  const mids = (deptKey) =>
    selected.map((u) => deptCost(u, deptKey)?.mid).filter((v) => v != null)
  const formatRange = (min, max) =>
    min == null && max == null
      ? '—'
      : min === max
        ? formatBDT(min)
        : `${formatBDT(min)} – ${formatBDT(max)}`

  // overall cost range per university, for the "estimated degree cost" row
  const overall = (u) => ({
    min: Math.min(...u.departments.map((d) => d.costMin ?? d.totalCost)),
    max: Math.max(...u.departments.map((d) => d.costMax ?? d.totalCost)),
  })
  const lowestOverall = Math.min(...selected.map((u) => overall(u).min))

  // plain-language verdict: who is cheaper in how many shared programmes
  const shared = allDepts.filter((k) => mids(k).length >= 2)
  const wins = Object.fromEntries(selected.map((u) => [u.id, 0]))
  shared.forEach((k) => {
    const best = Math.min(...mids(k))
    const winners = selected.filter((u) => deptCost(u, k)?.mid === best)
    if (winners.length === 1) wins[winners[0].id] += 1
  })
  const leader = [...selected].sort((a, b) => wins[b.id] - wins[a.id])[0]
  const showVerdict = selected.length > 1 && shared.length > 0
  const hasLeader = showVerdict && wins[leader.id] > 0 && wins[leader.id] * 2 > shared.length

  const labelCell = 'w-48 px-5 py-4 text-left align-middle text-sm font-normal text-slate-500'
  const row = 'border-t border-slate-200/70'

  /** A value cell; `best` gives it the highlight. */
  const Cell = ({ best, children }) => (
    <td className={cn('px-5 py-4 align-middle text-sm', best && 'bg-brand-50')}>
      {children}
      {best && <span className="ml-2 text-xs text-brand-700">{t('universities.compareLowest')}</span>}
    </td>
  )

  const statRow = (label, render) => (
    <tr className={row}>
      <th scope="row" className={labelCell}>
        {label}
      </th>
      {selected.map((u) => render(u))}
    </tr>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-slate-900">{t('universities.compareTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('universities.compareSubtitle')}</p>
      </div>

      {showVerdict && (
        <p className="mb-5 rounded-xl border-l-4 border-brand-600 bg-brand-50 px-5 py-4 text-[15px] leading-relaxed text-slate-800">
          {hasLeader
            ? t('universities.compareVerdict', {
                name: loc(leader.shortName),
                wins: wins[leader.id],
                total: shared.length,
              })
            : t('universities.compareVerdictTie')}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] table-fixed border-collapse">
            <thead>
              <tr>
                <th className="w-48 px-5 py-5 text-left align-bottom">
                  <Link
                    to={ROUTES.privateUniversities}
                    className="text-sm font-normal text-brand-700 underline-offset-2 hover:underline"
                  >
                    + {t('universities.browseUniversities')}
                  </Link>
                </th>
                {selected.map((u) => (
                  <th key={u.id} className="px-5 py-5 text-left align-top font-normal">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={route(ROUTES.privateUniversityDetail, { id: u.id })}
                          className="block font-display text-xl font-medium leading-snug text-slate-900 hover:text-brand-700"
                        >
                          {loc(u.name)}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500">
                          {loc(u.shortName)} · {loc(u.city)}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(u.id)}
                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title={t('universities.removeFromCompare')}
                        aria-label={t('universities.removeFromCompare')}
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statRow(t('universities.estimatedDegreeCost'), (u) => {
                const { min, max } = overall(u)
                return (
                  <Cell key={u.id} best={selected.length > 1 && min === lowestOverall}>
                    <span className="font-medium tabular-nums text-slate-900">
                      {formatRange(min, max)}
                    </span>
                  </Cell>
                )
              })}

              {statRow(t('universities.tuitionPerCredit'), (u) => (
                <Cell key={u.id}>
                  <span className="tabular-nums text-slate-800">
                    {u.perCreditMin == null ? '—' : formatRange(u.perCreditMin, u.perCreditMax)}
                  </span>
                </Cell>
              ))}

              {statRow(t('universities.compareDepartments'), (u) => (
                <Cell key={u.id}>
                  <span className="tabular-nums text-slate-800">{u.departments.length}</span>
                </Cell>
              ))}

              {statRow(t('universities.compareRank'), (u) => (
                <Cell key={u.id}>
                  <span className="tabular-nums text-slate-800">{u.rank ?? '—'}</span>
                </Cell>
              ))}

              {/* per-programme costs, with a proportional bar */}
              <tr className="border-t border-slate-200 bg-slate-50/70">
                <th
                  scope="colgroup"
                  colSpan={selected.length + 1}
                  className="px-5 py-3 text-left text-sm font-medium text-slate-900"
                >
                  {t('universities.compareProgrammes')}
                </th>
              </tr>
              {allDepts.map((deptKey) => {
                const values = mids(deptKey)
                const best = Math.min(...values)
                const top = Math.max(...values)
                return statRow(deptKey, (u) => {
                  const cost = deptCost(u, deptKey)
                  if (cost == null)
                    return (
                      <td key={u.id} className="px-5 py-4 text-sm text-slate-300">
                        —
                      </td>
                    )
                  const isBest = values.length > 1 && cost.mid === best
                  return (
                    <Cell key={u.id} best={isBest}>
                      <span
                        className={cn(
                          'tabular-nums',
                          isBest ? 'font-medium text-slate-900' : 'text-slate-700'
                        )}
                      >
                        {formatRange(cost.min, cost.max)}
                      </span>
                      <span className="mt-2 block h-1 rounded-full bg-slate-200/70">
                        <span
                          className={cn(
                            'block h-1 rounded-full',
                            isBest ? 'bg-brand-600' : 'bg-slate-400'
                          )}
                          style={{ width: `${Math.max(8, (cost.mid / top) * 100)}%` }}
                        />
                      </span>
                    </Cell>
                  )
                })
              })}

              {/* FR-4: source + verified */}
              <tr className="border-t border-slate-200">
                <th scope="row" className={labelCell}>
                  {t('universities.source')}
                </th>
                {selected.map((u) => (
                  <td key={u.id} className="px-5 py-4 align-top text-xs leading-relaxed text-slate-500">
                    {u.sourceUrl && (
                      <a
                        href={u.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-brand-700"
                      >
                        {t('universities.viewOfficial')}
                      </a>
                    )}
                    {u.lastVerified && (
                      <span className="block">
                        {t('universities.verifiedOn')} {formatDate(u.lastVerified, lang)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
