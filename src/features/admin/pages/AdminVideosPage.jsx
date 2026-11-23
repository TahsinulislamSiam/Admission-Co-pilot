import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Youtube, Plus, Trash2, ExternalLink, Filter } from 'lucide-react'
import { useVideos, useAddVideo, useDeleteVideo } from '../hooks/useAdmin'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label, Field } from '@/components/ui/Input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { SUBJECTS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

/**
 * Add YouTube lessons by subject/topic and delete existing ones. The student
 * Video section groups exactly these rows by subject.
 */
export function AdminVideosPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ title: '', subject: 'math', topic: '', youtubeUrl: '', channel: '' })
  const [filter, setFilter] = useState('all')

  useDocumentTitle(t('admin.videos.title'))
  const { data: videos = [], isLoading } = useVideos(filter === 'all' ? '' : filter)
  const addVideo = useAddVideo()
  const deleteVideo = useDeleteVideo()

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const grouped = useMemo(() => {
    const map = new Map()
    for (const v of videos) {
      if (!map.has(v.subject)) map.set(v.subject, [])
      map.get(v.subject).push(v)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [videos])

  const submit = (e) => {
    e.preventDefault()
    addVideo.mutate(form, {
      onSuccess: () => {
        toast.success(t('admin.videos.added'))
        setForm({ title: '', subject: form.subject, topic: '', youtubeUrl: '', channel: '' })
      },
      onError: (err) => {
        const code = err?.message || 'serverError'
        toast.error(t(`admin.videos.errors.${code}`, t('admin.videos.errors.serverError')))
      },
    })
  }

  const remove = (id) => {
    deleteVideo.mutate(id, {
      onSuccess: () => toast.success(t('admin.videos.removed')),
      onError: () => toast.error(t('admin.videos.errors.serverError')),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Youtube className="h-6 w-6 text-red-600" />
          {t('admin.videos.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('admin.videos.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.videos.addHeading')}
          </h2>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <Label htmlFor="video-title">{t('admin.videos.videoTitle')}</Label>
              <Input
                id="video-title"
                value={form.title}
                onChange={set('title')}
                placeholder={t('admin.videos.titlePlaceholder')}
                required
              />
            </Field>

            <Field>
              <Label htmlFor="video-subject">{t('admin.videos.subject')}</Label>
              <Select
                value={form.subject}
                onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}
              >
                <SelectTrigger id="video-subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {t(`subjects.${s.value}`, s.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <Label htmlFor="video-topic">{t('admin.videos.topic')}</Label>
              <Input
                id="video-topic"
                value={form.topic}
                onChange={set('topic')}
                placeholder={t('admin.videos.topicPlaceholder')}
              />
            </Field>

            <Field className="sm:col-span-2">
              <Label htmlFor="video-url">{t('admin.videos.youtubeUrl')}</Label>
              <Input
                id="video-url"
                value={form.youtubeUrl}
                onChange={set('youtubeUrl')}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="mt-1 text-xs text-slate-400">{t('admin.videos.urlHint')}</p>
            </Field>

            <Field>
              <Label htmlFor="video-channel">{t('admin.videos.channel')}</Label>
              <Input
                id="video-channel"
                value={form.channel}
                onChange={set('channel')}
                placeholder={t('admin.videos.channelPlaceholder')}
              />
            </Field>

            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={addVideo.isPending}>
                <Plus className="h-4 w-4" />
                {addVideo.isPending ? t('admin.videos.adding') : t('admin.videos.add')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('admin.videos.library', { count: videos.length })}
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.videos.allSubjects')}</SelectItem>
              {SUBJECTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {t(`subjects.${s.value}`, s.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : videos.length === 0 ? (
        <Card>
          <EmptyState
            icon={Youtube}
            title={t('admin.videos.emptyTitle')}
            description={t('admin.videos.emptyBody')}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([subject, items]) => (
            <Card key={subject}>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="brand">{t(`subjects.${subject}`, subject)}</Badge>
                  <span className="text-xs text-slate-400">
                    {t('admin.videos.count', { count: items.length })}
                  </span>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((v) => (
                    <li
                      key={v.id}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <a
                        href={v.youtubeUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block"
                      >
                        <img
                          src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`}
                          alt=""
                          loading="lazy"
                          className="aspect-video w-full object-cover"
                        />
                      </a>
                      <div className="space-y-1 p-3">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-800">{v.title}</p>
                        {v.topic && <p className="text-xs text-slate-500">{v.topic}</p>}
                        <p className="text-xs text-slate-400">
                          {v.channel || 'YouTube'} · {formatDate(v.createdAt, 'en')}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <a
                            href={v.youtubeUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t('admin.videos.open')}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(v.id)}
                            disabled={deleteVideo.isPending}
                            className="text-red-600 hover:bg-red-50"
                            aria-label={t('admin.videos.remove')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminVideosPage
