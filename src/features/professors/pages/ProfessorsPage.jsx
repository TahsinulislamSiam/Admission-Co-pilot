import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Search, Mail, ExternalLink, Users, MapPin } from 'lucide-react'
import { useProfessors } from '../hooks/useProfessors'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'

/**
 * Faculty directory: professors grouped by university, filterable by name and by
 * research field. Read-only for students; admins maintain the rows.
 */
export function ProfessorsPage() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [field, setField] = useState('all')

  useDocumentTitle(t('professors.title'))
  const { data: professors = [], isLoading } = useProfessors(q)

  // Field chips come from the data itself, most common first.
  const fields = useMemo(() => {
    const counts = new Map()
    for (const p of professors) {
      for (const f of p.researchFields ?? []) counts.set(f, (counts.get(f) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([name]) => name)
  }, [professors])

  const visible = useMemo(
    () =>
      field === 'all'
        ? professors
        : professors.filter((p) => (p.researchFields ?? []).includes(field)),
    [professors, field]
  )

  const grouped = useMemo(() => {
    const map = new Map()
    for (const p of visible) {
      if (!map.has(p.university)) map.set(p.university, [])
      map.get(p.university).push(p)
    }
    return [...map.entries()].sort((a, b) => {
      const ra = a[1][0]?.universityRank ?? 999
      const rb = b[1][0]?.universityRank ?? 999
      return ra - rb || a[0].localeCompare(b[0])
    })
  }, [visible])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <GraduationCap className="h-6 w-6 text-brand-600" />
          {t('professors.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('professors.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('professors.searchPlaceholder')}
              className="pl-9"
              aria-label={t('professors.searchPlaceholder')}
            />
          </div>

          {fields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={field === 'all' ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setField('all')}
              >
                {t('professors.allFields')}
              </Button>
              {fields.map((f) => (
                <Button
                  key={f}
                  type="button"
                  size="sm"
                  variant={field === f ? 'default' : 'outline'}
                  className={cn('rounded-full')}
                  onClick={() => setField(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : grouped.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={t('professors.emptyTitle')}
            description={t('professors.emptyBody')}
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(([university, list]) => (
            <section key={university}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-800">{university}</h2>
                {list[0]?.universityRank && (
                  <Badge variant="purple">
                    {t('professors.rank', { rank: list[0].universityRank })}
                  </Badge>
                )}
                {(list[0]?.city || list[0]?.country) && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {[list[0].city, list[0].country].filter(Boolean).join(', ')}
                  </span>
                )}
                {list[0]?.universityWebsite && (
                  <a
                    href={list[0].universityWebsite}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('professors.website')}
                  </a>
                )}
              </div>

              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((p) => (
                  <li key={p.id}>
                    <Card className="h-full">
                      <CardContent className="flex h-full flex-col gap-2 p-4">
                        <div>
                          <p className="font-semibold text-slate-800">{p.name}</p>
                          {p.title && <p className="text-xs text-slate-500">{p.title}</p>}
                          {p.department && (
                            <p className="mt-0.5 text-xs text-slate-400">{p.department}</p>
                          )}
                        </div>

                        {(p.researchFields ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.researchFields.slice(0, 4).map((f) => (
                              <span
                                key={f}
                                className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs">
                          {p.email ? (
                            <a
                              href={`mailto:${p.email}`}
                              className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {t('professors.email')}
                            </a>
                          ) : (
                            <span className="text-slate-300">{t('professors.emailUnavailable')}</span>
                          )}
                          {p.profileUrl && (
                            <a
                              href={p.profileUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 font-medium text-slate-500 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t('professors.profile')}
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProfessorsPage
