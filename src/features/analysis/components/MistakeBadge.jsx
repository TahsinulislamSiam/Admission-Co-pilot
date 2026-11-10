import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/Badge'
import { MISTAKE_TYPES, MISTAKE_TYPE_COLORS } from '@/lib/constants'

const variantMap = {
  concept: 'danger',
  careless: 'warning',
  time: 'info',
  guess: 'purple',
}

/** AI-6 — colored badge labelling a mistake type. */
export function MistakeBadge({ type, withLabel = true }) {
  const { t } = useTranslation()
  if (!type) return null
  return (
    <Badge variant={variantMap[type] || 'default'}>
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: MISTAKE_TYPE_COLORS[type] }}
      />
      {withLabel && t(`analysis.mistakeTypes.${type}`)}
    </Badge>
  )
}

/** Legend row of all four mistake types. */
export function MistakeLegend() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
      {MISTAKE_TYPES.map((mt) => (
        <span key={mt} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: MISTAKE_TYPE_COLORS[mt] }} />
          {t(`analysis.mistakeTypes.${mt}`)}
        </span>
      ))}
    </div>
  )
}
