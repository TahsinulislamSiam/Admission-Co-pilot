import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  MessagesSquare,
  ShieldCheck,
  Target,
  FileStack,
  BarChart3,
  Scale,
  GraduationCap,
  Bot,
  Send,
  Link2,
  ArrowRight,
} from 'lucide-react'
import { Navbar, Footer } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

/** Wrapper that fades + rises its children in the first time they scroll into view. */
function Reveal({ as: Tag = 'div', delay = 0, className, children, ...rest }) {
  const [ref, shown] = useReveal()
  return (
    <Tag
      ref={ref}
      className={cn(className, shown ? 'animate-fade-in-up' : 'opacity-0')}
      style={shown ? { animationDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}

const STEP_ICONS = [GraduationCap, Target, Sparkles, Scale, MessagesSquare, FileStack, BarChart3]

const FEATURE_ICONS = {
  chat: MessagesSquare,
  verified: ShieldCheck,
  recommend: Sparkles,
  tests: FileStack,
  analysis: BarChart3,
  compare: Scale,
}

/** Public landing page: hero, 7-step "how it works", features, CTA. */
export default function LandingPage() {
  useDocumentTitle('nav.home')
  const { t } = useTranslation()

  const steps = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'].map((k, i) => ({
    icon: STEP_ICONS[i],
    title: t(`landing.steps.${k}.title`),
    desc: t(`landing.steps.${k}.desc`),
  }))

  const features = [
    { key: 'chat', icon: FEATURE_ICONS.chat },
    { key: 'verified', icon: FEATURE_ICONS.verified },
    { key: 'recommend', icon: FEATURE_ICONS.recommend },
    { key: 'tests', icon: FEATURE_ICONS.tests },
    { key: 'analysis', icon: FEATURE_ICONS.analysis },
    { key: 'compare', icon: FEATURE_ICONS.compare },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        {/* soft drifting blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-24 -top-24 h-72 w-72 animate-drift-x rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute -right-16 top-10 h-80 w-80 animate-drift-y rounded-full bg-accent-200/40 blur-3xl" />
        </div>

        <div className="container-app relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="mb-5 inline-flex animate-pop-in items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              {t('landing.badge')}
            </span>
            <h1 className="animate-fade-in-up text-3xl font-normal leading-tight text-brand-900 [animation-delay:80ms] sm:text-4xl lg:text-[2.75rem]">
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl animate-fade-in-up text-base leading-relaxed text-slate-600 [animation-delay:180ms]">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-8 flex animate-fade-in-up flex-wrap gap-3 [animation-delay:280ms]">
              <Link to={ROUTES.register}>
                <Button size="lg">{t('landing.ctaPrimary')}</Button>
              </Link>
              <Link to={ROUTES.login}>
                <Button size="lg" variant="outline">
                  {t('landing.ctaSecondary')}
                </Button>
              </Link>
            </div>

            {/* stats strip */}
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                { v: t('landing.statsUniversitiesValue'), l: t('landing.statsUniversities') },
                { v: t('landing.statsQuestionsValue'), l: t('landing.statsQuestions') },
                { v: t('landing.statsSupportValue'), l: t('landing.statsSupport') },
              ].map((s, i) => (
                <div
                  key={i}
                  className="animate-pop-in rounded-xl border border-slate-200 bg-white p-4 text-center transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                  style={{ animationDelay: `${380 + i * 90}ms` }}
                >
                  <p className="text-xl font-extrabold text-brand-700">{s.v}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mock chat card */}
          <div className="relative hidden animate-fade-in-up [animation-delay:220ms] lg:block">
            <div className="animate-float rounded-2xl border border-slate-200 bg-white p-5 shadow-card-hover">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-slate-800">{t('landing.heroCardTitle')}</p>
              </div>

              <div className="space-y-3">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
                  {t('landing.heroCardQ')}
                </div>
                <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-700">
                  {t('landing.heroCardA')}
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-700">
                    <Link2 className="h-3 w-3" />
                    {t('landing.heroCardSource')}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3" style={{ width: 'fit-content' }}>
                  <span className="h-2 w-2 animate-typing-dot rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-typing-dot rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-typing-dot rounded-full bg-slate-400 [animation-delay:300ms]" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5">
                <span className="flex-1 text-sm text-slate-400">{t('assistant.placeholder')}</span>
                <Send className="h-4 w-4 text-brand-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works (7 steps) ---------- */}
      <section id="how-it-works" className="container-app py-20 scroll-mt-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {t('landing.howTitle')}
          </h2>
          <p className="mt-3 text-slate-500">{t('landing.howSubtitle')}</p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 70}>
              <Card className="group relative h-full p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
                <span className="absolute right-4 top-4 text-3xl font-black text-slate-100 transition-colors group-hover:text-brand-100">
                  {i + 1}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-transform duration-200 group-hover:scale-110">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-slate-800">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="bg-slate-50 py-20 scroll-mt-20">
        <div className="container-app">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {t('landing.featuresTitle')}
            </h2>
            <p className="mt-3 text-slate-500">{t('landing.featuresSubtitle')}</p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ key, icon: Icon }, i) => (
              <Reveal key={key} delay={i * 70}>
                <Card className="group h-full p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-800">
                    {t(`landing.feature${key.charAt(0).toUpperCase() + key.slice(1)}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {t(`landing.feature${key.charAt(0).toUpperCase() + key.slice(1)}.desc`)}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="container-app py-20">
        <Reveal className="relative overflow-hidden rounded-3xl bg-brand-800 px-8 py-14 text-center sm:px-14">
          <div
            className="pointer-events-none absolute inset-0 animate-drift-x opacity-20"
            style={{
              background:
                'radial-gradient(circle at 20% 20%, #34d399 0, transparent 40%), radial-gradient(circle at 80% 80%, #fbbf24 0, transparent 40%)',
            }}
          />
          <h2 className="relative text-2xl font-extrabold text-white sm:text-3xl">
            {t('landing.ctaTitle')}
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-brand-100">{t('landing.ctaDesc')}</p>
          <div className="relative mt-8">
            <Link to={ROUTES.register}>
              <Button size="lg" variant="accent" className="group">
                {t('landing.ctaButton')}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  )
}
