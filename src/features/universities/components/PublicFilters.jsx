import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, SlidersHorizontal, LayoutGrid, Table2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { CheckboxRow } from '@/components/ui/FormControls'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { useDebounce } from '@/hooks/useDebounce'
import { useLocale } from '@/hooks/useLocale'
import { daysUntil } from '@/lib/utils'

/**
 * FR-2 filter sidebar for the public hub:
 * search, group, city, deadline window, exam pattern, fee, seats, min HSC GPA.
 */
export function PublicFilters({ universities, onFilter }) {
  const { t } = useTranslation()
  const { loc } = useLocale()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [group, setGroup] = useState('all')
  const [city, setCity] = useState('all')
  const [deadline, setDeadline] = useState('any')
  const [pattern, setPattern] = useState('all')
  const [maxFee, setMaxFee] = useState('')
  const [minSeats, setMinSeats] = useState('')
  const [minHsc, setMinHsc] = useState('')

  // derive filter options from data
  const cities = useMemo(
    () => [...new Set(universities.map((u) => loc(u.city)))].sort(),
    [universities, loc]
  )

  const results = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return universities.filter((u) => {
      if (q) {
        const hay = [loc(u.name), loc(u.shortName), loc(u.city), u.established]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (group !== 'all' && !u.groups.includes(group)) return false
      if (city !== 'all' && loc(u.city) !== city) return false
      if (pattern !== 'all' && u.examPattern !== pattern) return false
      if (deadline !== 'any') {
        const d = daysUntil(u.deadline)
        if (d == null || d < 0 || d > Number(deadline)) return false
      }
      if (maxFee && u.applicationFee > Number(maxFee)) return false
      if (minSeats && u.seatsTotal < Number(minSeats)) return false
      if (minHsc && (u.minHscGpa ?? 0) < Number(minHsc)) return false
      return true
    })
  }, [
    universities,
    debouncedSearch,
    group,
    city,
    pattern,
    deadline,
    maxFee,
    minSeats,
    minHsc,
    loc,
  ])

  // notify parent whenever the result set changes
  useMemo(() => onFilter(results), [results, onFilter])

  const reset = () => {
    setSearch('')
    setGroup('all')
    setCity('all')
    setDeadline('any')
    setPattern('all')
    setMaxFee('')
    setMinSeats('')
    setMinHsc('')
  }

  return (
    <Card className="h-fit lg:sticky lg:top-24">
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <SlidersHorizontal className="h-4 w-4 text-brand-600" />
            {t('universities.filtersTitle')}
          </h3>
          <button
            onClick={reset}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            {t('common.clearFilters')}
          </button>
        </div>

        {/* search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('universities.searchPlaceholder')}
            className="pl-9"
          />
        </div>

        {/* group checkboxes */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('universities.filterGroup')}
        </p>
        <div className="mb-4 space-y-2">
          {['science', 'commerce', 'arts'].map((g) => (
            <CheckboxRow
              key={g}
              id={`flt-group-${g}`}
              label={t(`profile.groups.${g}`)}
              checked={group === 'all' ? false : group === g}
              disabled={group === 'all'}
              onCheckedChange={(v) => {
                if (group === 'all' && v) setGroup(g)
                else if (!v) setGroup('all')
              }}
            />
          ))}
          {group === 'all' && (
            <p className="text-xs text-slate-400">— {t('common.all')} —</p>
          )}
        </div>

        {/* city */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('universities.filterCity')}
        </p>
        <Select value={city} onValueChange={setCity} className="mb-4">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* deadline window */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('universities.filterDeadline')}
        </p>
        <Select value={deadline} onValueChange={setDeadline} className="mb-4">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t('universities.filterDeadlineAny')}</SelectItem>
            <SelectItem value="30">{t('universities.filterDeadline30')}</SelectItem>
            <SelectItem value="60">{t('universities.filterDeadline60')}</SelectItem>
          </SelectContent>
        </Select>

        {/* exam pattern */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('universities.filterPattern')}
        </p>
        <Select value={pattern} onValueChange={setPattern} className="mb-4">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {['MCQ', 'Written', 'MCQ + Written'].map((pt) => (
              <SelectItem key={pt} value={pt}>
                {pt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* numeric filters */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('universities.filterFeeMax')}
            </p>
            <Input
              type="number"
              min="0"
              placeholder="৳450"
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value)}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('universities.filterSeatsMin')}
            </p>
            <Input
              type="number"
              min="0"
              placeholder="1000"
              value={minSeats}
              onChange={(e) => setMinSeats(e.target.value)}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('universities.filterMinHsc')}
            </p>
            <Input
              type="number"
              step="0.25"
              min="0"
              max="5"
              placeholder="3.50"
              value={minHsc}
              onChange={(e) => setMinHsc(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Cards / Table view toggle used by both hub pages. */
export function ViewToggle({ value, onChange }) {
  const { t } = useTranslation()
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
      <button
        onClick={() => onChange('cards')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
          value === 'cards' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        {t('universities.cardsView')}
      </button>
      <button
        onClick={() => onChange('table')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
          value === 'table' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Table2 className="h-4 w-4" />
        {t('universities.tableView')}
      </button>
    </div>
  )
}

/** Sort control. options: [{value, label}] */
export function SortSelect({ value, onChange, options }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">{t('universities.sortBy')}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Small helper button for "go to compare" bar. */
export function CompareBar({ count, onClear, onGo }) {
  const { t } = useTranslation()
  if (!count) return null
  return (
    <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-card-hover">
      <span className="text-sm font-medium text-slate-700">
        {t('universities.compareSelected', { count })}
      </span>
      <Button size="sm" variant="ghost" onClick={onClear}>
        {t('universities.clearCompare')}
      </Button>
      <Button size="sm" onClick={onGo}>
        {t('universities.goCompare')}
      </Button>
    </div>
  )
}
