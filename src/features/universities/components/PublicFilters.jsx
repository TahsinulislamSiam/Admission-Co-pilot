import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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

  // Notify the parent whenever the result set changes.
  //
  // This MUST be an effect: calling onFilter() during render (e.g. inside
  // useMemo) sets parent state, which re-renders this component, which filters
  // again and calls onFilter again — an infinite render loop that froze the
  // public-university page.
  useEffect(() => {
    onFilter(results)
  }, [results, onFilter])

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

  const label = 'mb-1.5 block text-xs text-slate-500'

  return (
    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-base font-medium text-slate-900">{t('universities.filtersTitle')}</h2>
        <button
          onClick={reset}
          className="text-xs text-brand-700 underline-offset-2 hover:underline"
        >
          {t('common.clearFilters')}
        </button>
      </div>

      <div className="space-y-5">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.5}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('universities.searchPlaceholder')}
            className="pl-9"
          />
        </div>

        <fieldset>
          <legend className={label}>{t('universities.filterGroup')}</legend>
          <div className="space-y-2">
            {['science', 'commerce', 'arts'].map((g) => (
              <CheckboxRow
                key={g}
                id={`flt-group-${g}`}
                label={t(`profile.groups.${g}`)}
                checked={group === g}
                onCheckedChange={(v) => setGroup(v ? g : 'all')}
              />
            ))}
          </div>
        </fieldset>

        <div>
          <span className={label}>{t('universities.filterCity')}</span>
          <Select value={city} onValueChange={setCity}>
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
        </div>

        <div>
          <span className={label}>{t('universities.filterDeadline')}</span>
          <Select value={deadline} onValueChange={setDeadline}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t('universities.filterDeadlineAny')}</SelectItem>
              <SelectItem value="30">{t('universities.filterDeadline30')}</SelectItem>
              <SelectItem value="60">{t('universities.filterDeadline60')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <span className={label}>{t('universities.filterPattern')}</span>
          <Select value={pattern} onValueChange={setPattern}>
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
        </div>

        <div className="space-y-5 border-t border-slate-200/70 pt-5">
          <label className="block">
            <span className={label}>{t('universities.filterFeeMax')}</span>
            <Input
              type="number"
              min="0"
              placeholder="৳450"
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={label}>{t('universities.filterSeatsMin')}</span>
            <Input
              type="number"
              min="0"
              placeholder="1000"
              value={minSeats}
              onChange={(e) => setMinSeats(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={label}>{t('universities.filterMinHsc')}</span>
            <Input
              type="number"
              step="0.25"
              min="0"
              max="5"
              placeholder="3.50"
              value={minHsc}
              onChange={(e) => setMinHsc(e.target.value)}
            />
          </label>
        </div>
      </div>
    </aside>
  )
}

/** Cards / Table view toggle used by both hub pages. */
export function ViewToggle({ value, onChange }) {
  const { t } = useTranslation()
  const tab = (active) =>
    `rounded-md px-3 py-1 text-sm transition-colors ${
      active ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
    }`
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
      <button onClick={() => onChange('cards')} className={tab(value === 'cards')}>
        {t('universities.cardsView')}
      </button>
      <button onClick={() => onChange('table')} className={tab(value === 'table')}>
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
