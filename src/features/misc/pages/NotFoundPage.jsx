import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/routes/constants'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-brand-50 p-5">
        <Compass className="h-10 w-10 text-brand-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800">{t('common.notFoundTitle')}</h1>
      <p className="max-w-sm text-slate-500">{t('common.notFoundDesc')}</p>
      <Link to={ROUTES.landing}>
        <Button>{t('common.backHome')}</Button>
      </Link>
    </div>
  )
}
