import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  FileStack,
  TrendingUp,
  Trophy,
  PlayCircle,
  ArrowRight,
  Sparkles,
  MessagesSquare,
  Landmark,
  Building2,
  UserRound,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useDashboardAnalytics } from '../hooks/useDashboard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { useLocale } from '@/hooks/useLocale'
import { formatDate } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'
import { MISTAKE_TYPE_COLORS, MISTAKE_TYPES } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const quickLinks = [
  { to: ROUTES.assistant, icon: MessagesSquare, key: 'nav.assistant' },
  { to: ROUTES.recommendations, icon: Sparkles, key: 'nav.recommendations' },
  { to: ROUTES.publicUniversities, icon: Landmark, key: 'nav.publicUniversities' },
  { to: ROUTES.privateUniversities, icon: Building2, key: 'nav.privateUniversities' },
  { to: ROUTES.profile, icon: UserRound, key: 'nav.profile' },
]

/**
 * FR-8 — student dashboard:
 * test history line chart, weak topics bar chart, mistake-type donut,
 * suggested next practice and quick links.
 */
export default function DashboardPage() {
  useDocumentTitle('nav.dashboard')
  const { t } = useTranslation()
  const { lang } = useLocale()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: analytics, isLoading } = useDashboardAnalytics()

  if (isLoading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <SkeletonList count={2} className="h-64" />
      </div>
    )

  const noData = !analytics || analytics.testsTaken === 0

  return (
    <div>
      {/* header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <LayoutDashboard className="h-5 w-5 text-brand-600" />
            {t('dashboard.welcome', { name: user?.name || '' })}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {noData ? (
        <Card>
          <EmptyState
            icon={FileStack}
            title={t('dashboard.noData')}
            description={t('dashboard.noDataDesc')}
            action={
              <Link to={ROUTES.tests}>
                <Button>
                  <PlayCircle className="h-4 w-4" />
                  {t('dashboard.takeFirstTest')}
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* stat cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: FileStack, label: t('dashboard.testsTaken'), value: analytics.testsTaken, tone: 'text-brand-600' },
              { icon: TrendingUp, label: t('dashboard.avgScore'), value: `${analytics.avgScore}%`, tone: 'text-sky-600' },
              { icon: Trophy, label: t('dashboard.bestScore'), value: `${analytics.bestScore}%`, tone: 'text-accent-500' },
              { icon: PlayCircle, label: t('dashboard.lastScore'), value: `${analytics.lastScore}%`, tone: 'text-emerald-600' },
            ].map((s, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <s.icon className={`h-5 w-5 ${s.tone}`} />
                  <p className="mt-2 text-2xl font-extrabold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* charts row 1: history */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('dashboard.historyChartTitle')}</CardTitle>
              <p className="mt-0.5 text-xs text-slate-400">{t('dashboard.historyChartSubtitle')}</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.history} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tickFormatter={(v, i) => `${i + 1}`}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: '#10b981', strokeDasharray: '4 4' }}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                      formatter={(value) => [`${value}%`, t('dashboard.score')]}
                      labelFormatter={(v, payload) => {
                        const p = payload?.[0]?.payload
                        return p ? `${lang === 'bn' ? p.title?.bn : p.title?.en} · ${formatDate(p.date, lang)}` : v
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#059669' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* charts row 2: weak topics + mistake donut */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* weak topics bar */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.weakTopicsTitle')}</CardTitle>
                <p className="mt-0.5 text-xs text-slate-400">{t('dashboard.weakTopicsSubtitle')}</p>
              </CardHeader>
              <CardContent>
                {analytics.weakTopics.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">🎉 {t('analysis.correctBadge')} 100%</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.weakTopics}
                        layout="vertical"
                        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="topicLabel"
                          width={130}
                          tick={{ fontSize: 11, fill: '#475569' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(16,185,129,0.06)' }}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                          formatter={(v) => [v, t('dashboard.wrongCount')]}
                        />
                        <Bar dataKey="wrong" radius={[0, 8, 8, 0]} fill="#e11d48" barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* mistake types donut */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.mistakeChartTitle')}</CardTitle>
                <p className="mt-0.5 text-xs text-slate-400">{t('dashboard.mistakeChartSubtitle')}</p>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center">
                  <div className="h-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={MISTAKE_TYPES.map((mt) => ({
                            name: t(`analysis.mistakeTypes.${mt}`),
                            value: analytics.mistakeCounts[mt] || 0,
                            key: mt,
                          }))}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={88}
                          paddingAngle={3}
                        >
                          {MISTAKE_TYPES.map((mt) => (
                            <Cell key={mt} fill={MISTAKE_TYPE_COLORS[mt]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-40 shrink-0 space-y-2">
                    {MISTAKE_TYPES.map((mt) => (
                      <div key={mt} className="flex items-center gap-2 text-xs">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: MISTAKE_TYPE_COLORS[mt] }}
                        />
                        <span className="flex-1 text-slate-600">{t(`analysis.mistakeTypes.${mt}`)}</span>
                        <span className="font-bold text-slate-800">
                          {analytics.mistakeCounts[mt] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* suggested next practice + quick links */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('dashboard.suggestedTitle')}</CardTitle>
                <p className="mt-0.5 text-xs text-slate-400">{t('dashboard.suggestedSubtitle')}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestedTests(analytics).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {lang === 'bn' ? s.title.bn : s.title.en}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lang === 'bn' ? s.subject.bn : s.subject.en} ·{' '}
                        {t('dashboard.mistakeCount', { count: s.mistakes })}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => navigate(route(ROUTES.testInstructions, { id: s.id }))}>
                      {t('dashboard.startSuggested')}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* quick links */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.quickLinks')}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {quickLinks.map(({ to, icon: Icon, key }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Icon className="h-4 w-4 text-brand-600" />
                    {t(key)}
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* recent results */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('dashboard.recentResults')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {[...analytics.history].reverse().slice(0, 6).map((h) => (
                <Link
                  key={h.attemptId}
                  to={route(ROUTES.testResult, { attemptId: h.attemptId })}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {lang === 'bn' ? h.title?.bn : h.title?.en}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(h.date, lang)}</p>
                  </div>
                  <Badge variant={h.percentage >= 60 ? 'success' : h.percentage >= 40 ? 'warning' : 'danger'}>
                    {h.percentage}%
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

/** Pick practice suggestions from weak topics (uses the seeded test list). */
function suggestedTests(analytics) {
  const suggestions = [
    {
      id: 'test-math-01',
      title: { bn: 'গণিত — ক্যালকুলাস ও ত্রিকোণমিতি', en: 'Math — Calculus & Trigonometry' },
      subject: { bn: 'গণিত', en: 'Mathematics' },
      topicKeys: ['Calculus', 'Integration', 'Trigonometry', 'Probability', 'Vectors'],
      mistakes: 0,
    },
    {
      id: 'test-phy-01',
      title: { bn: 'পদার্থবিজ্ঞান — নিউটনীয় বলবিদ্যা ও আলোকবিজ্ঞান', en: 'Physics — Mechanics & Optics' },
      subject: { bn: 'পদার্থবিজ্ঞান', en: 'Physics' },
      topicKeys: ['Newtonian Mechanics', 'Optics', 'Electricity', 'Thermodynamics', 'Modern Physics'],
      mistakes: 0,
    },
    {
      id: 'test-chem-01',
      title: { bn: 'রসায়ন — পর্যায় সারণি ও স্টয়োকিওমেট্রি', en: 'Chemistry — Periodic Table & Stoichiometry' },
      subject: { bn: 'রসায়ন', en: 'Chemistry' },
      topicKeys: ['Periodic Table', 'Stoichiometry', 'Organic Chemistry', 'Acids & Bases'],
      mistakes: 0,
    },
    {
      id: 'test-bangla-01',
      title: { bn: 'বাংলা — ব্যাকরণ ও সাহিত্য', en: 'Bangla — ব্যাকরণ ও সাহিত্য' },
      subject: { bn: 'বাংলা', en: 'Bangla' },
      topicKeys: ['বাংলা ব্যাকরণ', 'বাংলা সাহিত্য'],
      mistakes: 0,
    },
    {
      id: 'test-eng-01',
      title: { bn: 'ইংরেজি — গ্রামার ও সাহিত্য', en: 'English — Grammar & Literature' },
      subject: { bn: 'ইংরেজি', en: 'English' },
      topicKeys: ['Grammar', 'Vocabulary', 'Literature'],
      mistakes: 0,
    },
  ]

  for (const s of suggestions) {
    s.mistakes = (analytics.weakTopics || []).filter(
      (wt) => s.topicKeys.includes(wt.topic) || s.topicKeys.includes(wt.topicLabel)
    ).length
  }
  return suggestions.sort((a, b) => b.mistakes - a.mistakes).slice(0, 3)
}
