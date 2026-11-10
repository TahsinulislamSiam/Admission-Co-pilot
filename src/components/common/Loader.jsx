import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/** Inline spinner (small) — used inside components. */
export function Spinner({ className }) {
  return <Loader2 className={cn('animate-spin', className || 'h-5 w-5 text-brand-600')} />
}

/** Full-page loader shown while lazy routes resolve. */
export function PageLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      <p className="text-sm text-slate-500">{t('common.loading')}</p>
    </div>
  )
}
