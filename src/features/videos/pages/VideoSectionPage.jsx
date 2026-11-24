import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlayCircle, Youtube, ExternalLink } from 'lucide-react'
import { useVideos } from '@/features/admin/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { SUBJECTS } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * Video lessons added by an admin, grouped by subject. Clicking a card plays it
 * in a YouTube embed so the student never leaves the app.
 */
export function VideoSectionPage() {
  const { t } = useTranslation()
  const [subject, setSubject] = useState('all')
  const [playing, setPlaying] = useState(null)

  useDocumentTitle(t('videos.title'))
  const { data: videos = [], isLoading } = useVideos('')

  const subjects = useMemo(() => {
    const present = new Set(videos.map((v) => v.subject))
    return SUBJECTS.filter((s) => present.has(s.value))
  }, [videos])

  const visible = useMemo(
    () => (subject === 'all' ? videos : videos.filter((v) => v.subject === subject)),
    [videos, subject]
  )

  const grouped = useMemo(() => {
    const map = new Map()
    for (const v of visible) {
      if (!map.has(v.subject)) map.set(v.subject, [])
      map.get(v.subject).push(v)
    }
    return [...map.entries()]
  }, [visible])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <PlayCircle className="h-6 w-6 text-brand-600" />
          {t('videos.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('videos.subtitle')}</p>
      </div>

      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <SubjectChip active={subject === 'all'} onClick={() => setSubject('all')}>
            {t('videos.all')}
          </SubjectChip>
          {subjects.map((s) => (
            <SubjectChip key={s.value} active={subject === s.value} onClick={() => setSubject(s.value)}>
              {t(`subjects.${s.value}`, s.label)}
            </SubjectChip>
          ))}
        </div>
      )}

      {isLoading ? (
        <SkeletonList count={4} />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Youtube}
            title={t('videos.emptyTitle')}
            description={t('videos.emptyBody')}
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(([subj, items]) => (
            <section key={subj}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-800">
                  {t(`subjects.${subj}`, subj)}
                </h2>
                <Badge variant="default">{items.length}</Badge>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => setPlaying(v)}
                      className="group w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      <span className="relative block">
                        <img
                          src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`}
                          alt=""
                          loading="lazy"
                          className="aspect-video w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/25 opacity-0 transition-opacity group-hover:opacity-100">
                          <PlayCircle className="h-12 w-12 text-white" />
                        </span>
                      </span>
                      <span className="block space-y-1 p-3">
                        <span className="line-clamp-2 block text-sm font-semibold text-slate-800">
                          {v.title}
                        </span>
                        {v.topic && (
                          <span className="block text-xs text-slate-500">{v.topic}</span>
                        )}
                        {v.channel && (
                          <span className="block text-xs text-slate-400">{v.channel}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(playing)}
        onOpenChange={(open) => !open && setPlaying(null)}
        title={playing?.title || ''}
        description={playing?.channel || ''}
        className="max-w-3xl"
        footer={
          playing && (
            <a
              href={playing.youtubeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {t('videos.openOnYoutube')}
            </a>
          )
        }
      >
        {playing && (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe
              title={playing.title}
              src={`https://www.youtube.com/embed/${playing.youtubeId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

function SubjectChip({ active, onClick, children }) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn('rounded-full', active && 'shadow-sm')}
    >
      {children}
    </Button>
  )
}

export default VideoSectionPage
