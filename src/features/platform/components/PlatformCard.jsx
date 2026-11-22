import { useTranslation } from 'react-i18next'
import { ExternalLink, MapPin, Search, Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { focusLabel, successRatesAreSample } from '../platformData'

/**
 * One coaching platform.
 *
 * "Platform" is the center's own site when the dataset has one; when it does
 * not, the card offers the dataset's discovery search link instead of a dead
 * end. Success rates are shown only if the dataset carries a verified
 * percentage, otherwise the honest note is displayed.
 */
export function PlatformCard({ platform, lang }) {
  const { t } = useTranslation()
  const { name, focus, successRate, successRateNote, site, discoveryUrl, siteNote, location } =
    platform
  const href = site || discoveryUrl

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-slate-900">{name}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {successRate === null ? (
            <Badge variant="warning" title={successRateNote}>
              {t('platform.notVerified')}
            </Badge>
          ) : (
            <>
              <Badge variant="success" title={successRateNote}>
                {successRate}%
              </Badge>
              {/* Randomly generated figures must never look like verified results. */}
              {successRatesAreSample && (
                <Badge variant="outline" title={successRateNote}>
                  {t('platform.sampleRate')}
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {focus.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {focus.map((f) => (
            <Badge key={f} variant="brand">
              {focusLabel(f, lang)}
            </Badge>
          ))}
        </div>
      )}

      {location && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <span>{location}</span>
        </p>
      )}

      {successRateNote && (
        <p
          className={cn(
            'mt-3 flex items-start gap-1.5 rounded-lg px-3 py-2 text-xs',
            successRate === null ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-600'
          )}
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{successRateNote}</span>
        </p>
      )}

      {platform.resultClaims.length > 0 && (
        <div className="mt-3 text-xs text-slate-500">
          <p className="font-medium text-slate-600">{t('platform.claimedResults')}</p>
          <ul className="mt-1 space-y-0.5">
            {platform.resultClaims.map((c) => (
              <li key={`${c.session}-${c.exam}`}>
                {c.exam}: {c.claimed_qualified_count} ({c.session})
              </li>
            ))}
          </ul>
        </div>
      )}

      {siteNote && <p className="mt-2 text-xs text-slate-500">{siteNote}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={
              site
                ? 'inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100'
                : 'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50'
            }
          >
            {site ? <ExternalLink className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            {site ? t('platform.officialSite') : t('platform.searchOfficial')}
          </a>
        )}
        {platform.sources
          .filter((u) => u !== href)
          .slice(0, 2)
          .map((url, i) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {t('platform.source')} {i + 1}
            </a>
          ))}
      </div>
    </Card>
  )
}
