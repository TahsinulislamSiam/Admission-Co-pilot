import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Compass,
  Bot,
  Send,
  Link2,
  MessagesSquare,
  ShieldCheck,
  Target,
  FileStack,
  BarChart3,
  Scale,
  GraduationCap,
  ArrowRight,
} from 'lucide-react'
import { Navbar, Footer } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useReveal } from '@/hooks/useReveal'
import { useCountUp } from '@/hooks/useCountUp'
import { useLandingStats } from '@/features/landing/hooks/useLandingStats'
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

/**
 * One live figure in the hero strip: skeleton while the count loads, then the
 * number counts up as it scrolls into view.
 */
function StatCard({ value, label, delay = 0, shown, failed }) {
  const count = useCountUp(value, { enabled: shown })
  const { i18n } = useTranslation()
  const loading = value == null && !failed
  const display = failed
    ? '—'
    : loading
      ? null
      : new Intl.NumberFormat(i18n.language?.startsWith('bn') ? 'bn-BD' : 'en-US').format(
          count ?? value
        )

  return (
    <div
      className="animate-pop-in px-6 first:pl-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      {loading ? (
        <>
          <span aria-hidden="true" className="block h-8 w-14 animate-pulse rounded bg-slate-200" />
          <span className="sr-only">{label}</span>
        </>
      ) : (
        <p className="font-display text-3xl font-medium text-brand-700 tabular-nums">{display}</p>
      )}
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  )
}

/** One pass of the quote list; rendered twice to make the loop seamless. */
function QuoteRow({ quotes, duplicate = false }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={duplicate ? 'true' : undefined}>
      {quotes.map((quote, i) => (
        <li key={`${duplicate ? 'b' : 'a'}-${i}`} className="flex items-center whitespace-nowrap">
          <span className="mx-6 h-1 w-1 shrink-0 rounded-full bg-accent-500" aria-hidden="true" />
          <span className="text-sm font-medium text-brand-50/90">{quote}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Endless horizontal quote band.
 *
 * The track holds the list twice and slides by exactly -50%, so the second copy
 * lands where the first started and the loop never jumps. Pauses while hovered
 * and stays completely still for `prefers-reduced-motion` visitors.
 */
function QuoteMarquee({ quotes, label }) {
  if (!quotes.length) return null
  return (
    <section
      className="group relative overflow-hidden border-y border-brand-900/40 bg-brand-600 py-3.5"
      aria-label={label}
    >
      {/* edge fades so quotes slide in/out instead of being cut off */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-brand-600 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-brand-600 to-transparent"
      />

      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:px-4">
        <QuoteRow quotes={quotes} />
        <QuoteRow quotes={quotes} duplicate />
      </div>
    </section>
  )
}

const STEP_ICONS = [GraduationCap, Compass, Scale, MessagesSquare, FileStack, BarChart3]

const FEATURE_ICONS = {
  chat: MessagesSquare,
  verified: ShieldCheck,
  recommend: Compass,
  tests: FileStack,
  analysis: BarChart3,
  compare: Scale,
}

/** Public landing page: hero, 7-step "how it works", features, CTA. */
export default function LandingPage() {
  useDocumentTitle('nav.home')
  const { t } = useTranslation()
  const stats = useLandingStats()
  const [statsRef, statsShown] = useReveal({ threshold: 0.25 })

  // Motivational lines for the marquee band (one list per language).
  const marqueeQuotes = t('landing.quotes', { returnObjects: true })
  const quotes = Array.isArray(marqueeQuotes) ? marqueeQuotes : []

  // Live figures — nothing here is hardcoded, the counts come from the API.
  const statCards = [
    {
      key: 'universities',
      icon: GraduationCap,
      value: stats.data?.universities,
      label: t('landing.statsUniversities', { defaultValue: 'University records' }),
    },
    {
      key: 'questions',
      icon: FileStack,
      value: stats.data?.questions,
      label: t('landing.statsQuestions', { defaultValue: 'Practice questions' }),
    },
    {
      key: 'tests',
      icon: Target,
      value: stats.data?.tests,
      label: t('landing.statsTests', { defaultValue: 'Mock tests' }),
    },
  ]

  const steps = ['s1', 's3', 's4', 's5', 's6', 's7'].map((k, i) => ({
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-slate-50">
        {/* photo of the product's world: books and reading glasses, kept to the right */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-[position:85%_35%] bg-no-repeat"
          style={{ backgroundImage: "url('/Images/landing-hero.webp')" }}
        />
        {/* cream fade keeps the text on calm space; it also hands the bottom over to the stats strip */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-slate-50/85 lg:bg-transparent lg:bg-[linear-gradient(to_right,#F5F0E6_0%,#F5F0E6_38%,rgba(245,240,230,0.55)_52%,rgba(245,240,230,0)_66%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-slate-50 to-slate-50/0"
        />
        <div className="container-app relative pt-14 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="mb-5 inline-flex animate-pop-in items-center rounded-full bg-accent-100 px-3.5 py-1 text-sm text-accent-800">
                {t('landing.badge')}
              </span>
              <h1 className="max-w-[34rem] animate-fade-in-up font-display text-4xl font-medium leading-[1.15] text-brand-700 [animation-delay:80ms] sm:text-5xl">
                {t('landing.heroTitle')}
              </h1>
              <p className="mt-6 max-w-xl animate-fade-in-up text-base leading-relaxed text-slate-600 [animation-delay:180ms]">
                {t('landing.heroSubtitle')}
              </p>
              <div className="mt-8 flex animate-fade-in-up flex-wrap gap-3 [animation-delay:280ms]">
                <Link to={ROUTES.register}>
                  <Button size="lg">{t('landing.ctaPrimary')}</Button>
                </Link>
                <Link to={ROUTES.login}>
                  <Button size="lg" variant="ghost">
                    {t('landing.ctaSecondary')}
                  </Button>
                </Link>
                <Link to={ROUTES.adminLogin}>
                  <Button size="lg" variant="ghost">
                    <ShieldCheck className="h-4 w-4" />
                    {t('landing.adminLogin')}
                  </Button>
                </Link>
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

          {/* ledger strip: live counts across the full width */}
          <div ref={statsRef} className="mt-14 border-t border-slate-300 lg:mt-20">
            <p className="flex items-center gap-2 pt-4 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
              {t('landing.statsLive', { defaultValue: 'Live data' })}
            </p>
            <div data-testid="live-stats" className="grid grid-cols-3 divide-x divide-slate-300 pb-10 pt-3">
              {statCards.map((card, i) => (
                <StatCard
                  key={card.key}
                  value={card.value}
                  label={card.label}
                  failed={stats.isError}
                  shown={statsShown}
                  delay={380 + i * 90}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Motivational quote marquee ---------- */}
      <QuoteMarquee
        quotes={quotes}
        label={t('landing.quotesLabel', {
          defaultValue: 'Motivational quotes for admission candidates',
        })}
      />

      {/* ---------- How it works (6 steps) ---------- */}
      <section id="how-it-works" className="relative isolate overflow-hidden scroll-mt-20">
        {/* photo in a faded sepia tone (no overlay); the headline and cards sit on top */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-[position:center_35%] bg-no-repeat"
          style={{ backgroundImage: "url('/Images/landing-steps.webp')" }}
        />

        {/* two crops of this section's own photo, tucked into the corners (z-0), behind the cards */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 right-0 z-0 hidden h-[261px] w-[480px] bg-[length:922px_auto] bg-[position:-127px_-127px] bg-no-repeat [mask-image:linear-gradient(to_bottom,black_55%,transparent),linear-gradient(to_left,black_60%,transparent)] [mask-composite:intersect] lg:block"
          style={{ backgroundImage: "url('/Images/landing-steps.webp')" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-2 left-0 z-0 hidden h-[210px] w-[420px] bg-[length:1200px_auto] bg-[position:-270px_-500px] bg-no-repeat [mask-image:linear-gradient(to_top,black_55%,transparent),linear-gradient(to_right,black_60%,transparent)] [mask-composite:intersect] lg:block"
          style={{ backgroundImage: "url('/Images/landing-steps.webp')" }}
        />

        <div className="container-app relative z-10 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-brand-900 sm:text-4xl">
              {t('landing.howTitle')}
            </h2>
            <p className="mt-3 text-brand-900/90">{t('landing.howSubtitle')}</p>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={i} delay={i * 70}>
                <Card className="group relative h-full border-slate-200 bg-white/90 p-6 transition-colors duration-200 hover:bg-white">
                  <span className="absolute right-5 top-4 font-display text-3xl text-slate-300 transition-colors group-hover:text-accent-600">
                    {i + 1}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-slate-800">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section
        id="features"
        className="relative isolate overflow-hidden border-y border-slate-200 bg-slate-100 py-20 scroll-mt-20"
      >
        {/* books tucked into two corners, behind the cards (z-0); both are crops of one photo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 right-0 z-0 hidden h-[600px] w-[360px] bg-[length:1056px_auto] bg-[position:-696px_-29px] bg-no-repeat mix-blend-multiply [mask-image:linear-gradient(to_bottom,black_55%,transparent),linear-gradient(to_left,black_70%,transparent)] [mask-composite:intersect] lg:block"
          style={{ backgroundImage: "url('/Images/auth-bg.webp')" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-2 left-0 z-0 hidden h-[290px] w-[590px] bg-[length:1210px_auto] bg-[position:-44px_-429px] bg-no-repeat mix-blend-multiply [mask-image:linear-gradient(to_top,black_55%,transparent),linear-gradient(to_right,black_70%,transparent)] [mask-composite:intersect] lg:block"
          style={{ backgroundImage: "url('/Images/auth-bg.webp')" }}
        />
        <div className="container-app relative z-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-slate-900 sm:text-4xl">
              {t('landing.featuresTitle')}
            </h2>
            <p className="mt-3 text-slate-500">{t('landing.featuresSubtitle')}</p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ key, icon: Icon }, i) => (
              <Reveal key={key} delay={i * 70}>
                <Card className="group h-full p-6 transition-colors duration-200 hover:border-brand-300">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white">
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
        <Reveal className="relative overflow-hidden rounded-2xl bg-brand-600 px-8 py-14 text-center sm:px-14">
          <h2 className="relative font-display text-3xl font-medium text-white sm:text-4xl">
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
