import { ExternalLink, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/Badge'
import { useLocale } from '@/hooks/useLocale'
import { formatDate } from '@/lib/utils'

/**
 * FR-4 — every university record must show a clickable source link
 * plus a "Last verified: <date>" badge. Used on cards, tables, detail
 * pages, compare view and AI answers.
 */
export function SourceLink({ url, label, compact = false }) {
  const { t } = useTranslation()
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={
        compact
          ? 'inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline'
          : 'inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100'
      }
      title={label || t('universities.source')}
    >
      <ExternalLink className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
      {label || t('universities.viewOfficial')}
    </a>
  )
}

/** "Last verified" badge shown beside every record (FR-4). */
export function VerifiedBadge({ date, className }) {
  const { t } = useTranslation()
  const { lang } = useLocale()
  return (
    <Badge variant="success" className={className} title={formatDate(date, lang)}>
      <ShieldCheck className="h-3 w-3" />
      {t('universities.verifiedOn')}: {formatDate(date, lang)}
    </Badge>
  )
}
