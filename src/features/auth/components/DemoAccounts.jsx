import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'

/**
 * Quick-fill demo credentials for reviewers. Clicking fills the form.
 * (The mock backend knows these users.)
 */
export function DemoAccounts({ onFill }) {
  const { t } = useTranslation()
  const [filled, setFilled] = useState(null)

  const accounts = [
    {
      id: 'student',
      label: t('auth.demoStudent'),
      email: 'student@example.com',
      password: 'password123',
    },
    {
      id: 'admin',
      label: t('auth.demoAdmin'),
      email: 'admin@example.com',
      password: 'admin123',
    },
  ]

  return (
    <div className="mt-6 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
        <Sparkles className="h-3.5 w-3.5" />
        {t('auth.demoAccounts')}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {accounts.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              onFill({ email: a.email, password: a.password })
              setFilled(a.id)
            }}
            className="flex items-center justify-between gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-left text-xs hover:bg-brand-50"
          >
            <span className="font-semibold text-slate-700">{a.label}</span>
            <span className="font-mono text-[11px] text-slate-400">
              {filled === a.id ? a.email : `${t('auth.fill')} →`}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
