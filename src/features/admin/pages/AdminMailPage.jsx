import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Mail, Send, Inbox as InboxIcon, CornerUpLeft, Search, UserRound } from 'lucide-react'
import {
  useInbox,
  useSentMail,
  useSendMail,
  useMarkMailRead,
  useAdminUsers,
} from '../hooks/useAdmin'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label, Field } from '@/components/ui/Input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn, formatDate } from '@/lib/utils'

/**
 * In-app mailbox. Messages are rows in Postgres, so "sent" and "received" both
 * work without an SMTP server; students read the same thread in their account.
 */
export function AdminMailPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('inbox')
  const [openId, setOpenId] = useState(null)
  const [replyTo, setReplyTo] = useState(null)

  useDocumentTitle(t('admin.mail.title'))
  const { data: inbox = [], isLoading: inboxLoading } = useInbox()
  const { data: sent = [], isLoading: sentLoading } = useSentMail()
  const { data: users = [] } = useAdminUsers('')
  const sendMail = useSendMail()
  const markRead = useMarkMailRead()

  const unread = useMemo(() => inbox.filter((m) => !m.readAt).length, [inbox])
  const active = tab === 'inbox' ? inbox : sent
  const activeLoading = tab === 'inbox' ? inboxLoading : sentLoading

  const openMessage = (m) => {
    setOpenId(m.id)
    if (tab === 'inbox' && !m.readAt) markRead.mutate(m.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Mail className="h-6 w-6 text-brand-600" />
            {t('admin.mail.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('admin.mail.subtitle')}</p>
        </div>
        {unread > 0 && <Badge variant="brand">{t('admin.mail.unread', { count: unread })}</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardContent className="p-5">
            <Tabs value={tab} onValueChange={(v) => { setTab(v); setOpenId(null) }}>
              <TabsList>
                <TabsTrigger value="inbox">
                  <InboxIcon className="mr-1.5 h-4 w-4" />
                  {t('admin.mail.inbox')}
                  {unread > 0 && (
                    <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 text-[10px] text-white">
                      {unread}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent">
                  <Send className="mr-1.5 h-4 w-4" />
                  {t('admin.mail.sentTab')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={tab}>
                {activeLoading ? (
                  <SkeletonList count={3} />
                ) : active.length === 0 ? (
                  <EmptyState
                    icon={Mail}
                    title={t('admin.mail.emptyTitle')}
                    description={
                      tab === 'inbox' ? t('admin.mail.emptyInbox') : t('admin.mail.emptySent')
                    }
                  />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {active.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => openMessage(m)}
                          className={cn(
                            'flex w-full items-start gap-3 px-1 py-3 text-left transition-colors hover:bg-slate-50',
                            openId === m.id && 'bg-slate-50'
                          )}
                        >
                          <span
                            className={cn(
                              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                              !m.readAt && tab === 'inbox' ? 'bg-brand-600' : 'bg-slate-200'
                            )}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span
                                className={cn(
                                  'truncate text-sm',
                                  !m.readAt && tab === 'inbox'
                                    ? 'font-semibold text-slate-900'
                                    : 'font-medium text-slate-700'
                                )}
                              >
                                {m.subject}
                              </span>
                              <span className="shrink-0 text-xs text-slate-400">
                                {formatDate(m.createdAt, 'en')}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {tab === 'inbox' ? t('admin.mail.from') : t('admin.mail.to')}{' '}
                              {m.peer?.name} · {m.peer?.email}
                            </span>
                            {openId === m.id && (
                              <span className="mt-2 block whitespace-pre-wrap text-sm text-slate-600">
                                {m.body}
                              </span>
                            )}
                          </span>
                        </button>
                        {openId === m.id && tab === 'inbox' && (
                          <div className="pb-3 pl-8">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyTo(m.peer)}
                              className="text-brand-600"
                            >
                              <CornerUpLeft className="h-4 w-4" />
                              {t('admin.mail.reply')}
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <ComposeCard
          key={replyTo?.email || 'new'}
          users={users}
          replyTo={replyTo}
          onSent={() => {
            setReplyTo(null)
            setTab('sent')
          }}
          sending={sendMail.isPending}
          onSend={(payload, done) =>
            sendMail.mutate(payload, {
              onSuccess: () => {
                toast.success(t('admin.mail.sent'))
                done()
              },
              onError: (err) => {
                const code = err?.message || 'serverError'
                toast.error(t(`admin.mail.errors.${code}`, t('admin.mail.errors.serverError')))
              },
            })
          }
        />
      </div>
    </div>
  )
}

function ComposeCard({ users, replyTo, onSend, sending, onSent }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    toEmail: replyTo?.email || '',
    subject: replyTo ? t('admin.mail.replySubject') : '',
    body: '',
  })
  const [q, setQ] = useState('')

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return []
    return users
      .filter(
        (u) =>
          u.email.toLowerCase().includes(needle) || u.name?.toLowerCase().includes(needle)
      )
      .slice(0, 6)
  }, [q, users])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    onSend(form, () => {
      setForm({ toEmail: '', subject: '', body: '' })
      onSent()
    })
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Send className="h-4 w-4" />
          {t('admin.mail.compose')}
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <Field>
            <Label htmlFor="mail-to">{t('admin.mail.toLabel')}</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="mail-to"
                value={form.toEmail}
                onChange={set('toEmail')}
                placeholder={t('admin.mail.toPlaceholder')}
                className="pl-9"
                required
                type="email"
              />
            </div>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('admin.mail.searchUsers')}
                className="pl-9"
                aria-label={t('admin.mail.searchUsers')}
              />
            </div>
            {matches.length > 0 && (
              <ul className="mt-1 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {matches.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, toEmail: u.email }))
                        setQ('')
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-700">{u.name}</span>
                      <span className="text-xs text-slate-400">{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          <Field>
            <Label htmlFor="mail-subject">{t('admin.mail.subject')}</Label>
            <Input id="mail-subject" value={form.subject} onChange={set('subject')} required />
          </Field>

          <Field>
            <Label htmlFor="mail-body">{t('admin.mail.message')}</Label>
            <textarea
              id="mail-body"
              value={form.body}
              onChange={set('body')}
              rows={6}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder={t('admin.mail.messagePlaceholder')}
            />
          </Field>

          <Button type="submit" disabled={sending}>
            <Send className="h-4 w-4" />
            {sending ? t('admin.mail.sending') : t('admin.mail.send')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default AdminMailPage
