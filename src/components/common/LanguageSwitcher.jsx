import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

/** Bangla/English toggle. Persists the choice; updates <html lang>. */
export function LanguageSwitcher({ className }) {
  const { i18n } = useTranslation()
  const setLanguage = useUiStore((s) => s.setLanguage)
  const current = i18n.language === 'en' ? 'en' : 'bn'

  const toggle = () => {
    const next = current === 'bn' ? 'en' : 'bn'
    setLanguage(next)
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700',
        'transition-colors hover:border-brand-400 hover:text-brand-700',
        className
      )}
      title="বাংলা / English"
    >
      <Languages className="h-4 w-4" />
      <span className={current === 'bn' ? 'font-semibold' : ''}>বাংলা</span>
      <span className="text-slate-300">|</span>
      <span className={current === 'en' ? 'font-semibold' : ''}>EN</span>
    </button>
  )
}
