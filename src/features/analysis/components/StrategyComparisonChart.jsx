import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'

/**
 * AI-7 — strategy comparison chart:
 * "answer everything" vs "answer only when confident" with the score difference.
 */
export function StrategyComparisonChart({ data }) {
  const { t } = useTranslation()

  const rows = [
    { name: t('analysis.strategyAnswerAll'), score: data.answerEverything, fill: '#94a3af' },
    { name: t('analysis.strategyConfident'), score: data.confidentOnly, fill: '#10b981' },
  ]

  const diff = data.diff

  return (
    <div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 18, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              cursor={{ fill: 'rgba(16,185,129,0.06)' }}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
            />
            <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={72}>
              {rows.map((r, i) => (
                <Cell key={i} fill={r.fill} />
              ))}
              <LabelList dataKey="score" position="top" style={{ fontSize: 13, fontWeight: 700, fill: '#334155' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* difference note */}
      <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-800">{t('analysis.strategyDiff')}: </span>
        <span className={diff >= 0 ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
          {diff >= 0 ? '+' : ''}
          {diff}
        </span>
      </div>
    </div>
  )
}
