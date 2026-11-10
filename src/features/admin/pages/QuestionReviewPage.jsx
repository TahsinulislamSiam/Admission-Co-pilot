import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Pencil,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import {
  useQuestionReviews,
  useUpdateQuestion,
  useApproveQuestion,
  useRejectQuestion,
} from '../hooks/useAdmin'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label, Field, Textarea } from '@/components/ui/Input'
import { RadioGroup, Radio } from '@/components/ui/FormControls'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { MarkdownContent } from '@/components/common/MarkdownContent'
import { useLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const statusVariant = { approved: 'success', pending: 'warning', rejected: 'danger' }
const difficultyVariant = { easy: 'success', medium: 'warning', hard: 'danger' }
const optionLetters = ['A', 'B', 'C', 'D']

const emptyEdit = {
  textEn: '',
  textBn: '',
  options: [
    { en: '', bn: '' },
    { en: '', bn: '' },
    { en: '', bn: '' },
    { en: '', bn: '' },
  ],
  correct: 0,
  topic: '',
  difficulty: 'medium',
  explanationBn: '',
}

/** Admin — question bank review: approve, reject or edit each question. */
export default function QuestionReviewPage() {
  useDocumentTitle('admin.nav.questions')
  const { t } = useTranslation()
  const { loc, lang } = useLocale()

  const [status, setStatus] = useState('all')
  const { data: questions = [], isLoading } = useQuestionReviews(
    status === 'all' ? undefined : status
  )
  const update = useUpdateQuestion()
  const approve = useApproveQuestion()
  const reject = useRejectQuestion()

  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState(emptyEdit)

  useEffect(() => {
    if (rejectTarget) setRejectReason('')
  }, [rejectTarget])

  useEffect(() => {
    if (!editTarget) return
    setEditForm({
      textEn: editTarget.text?.en || '',
      textBn: editTarget.text?.bn || '',
      options: [0, 1, 2, 3].map((i) => ({
        en: editTarget.options?.[i]?.en || '',
        bn: editTarget.options?.[i]?.bn || '',
      })),
      correct: editTarget.correct ?? 0,
      topic: editTarget.topic || '',
      difficulty: editTarget.difficulty || 'medium',
      explanationBn: editTarget.explanation?.bn || '',
    })
  }, [editTarget])

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(approveTarget.id)
      toast.success(t('admin.questions.approved'))
      setApproveTarget(null)
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    try {
      await reject.mutateAsync({ id: rejectTarget.id, reason: rejectReason.trim() })
      toast.success(t('admin.questions.rejected'))
      setRejectTarget(null)
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  const handleSaveEdit = async () => {
    try {
      await update.mutateAsync({
        id: editTarget.id,
        payload: {
          text: { en: editForm.textEn.trim(), bn: editForm.textBn.trim() },
          options: editForm.options.map((o) => ({ en: o.en.trim(), bn: o.bn.trim() })),
          correct: Number(editForm.correct),
          topic: editForm.topic.trim(),
          difficulty: editForm.difficulty,
          explanation: { ...(editTarget.explanation || {}), bn: editForm.explanationBn },
        },
      })
      toast.success(t('admin.questions.updated'))
      setEditTarget(null)
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ClipboardCheck className="h-5 w-5 text-brand-600" />
          {t('admin.questions.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('admin.questions.subtitle')}</p>
      </div>

      {/* status filter */}
      <Tabs value={status} onValueChange={setStatus} className="mb-5">
        <TabsList>
          <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
          <TabsTrigger value="approved">{t('admin.questions.statuses.approved')}</TabsTrigger>
          <TabsTrigger value="pending">{t('admin.questions.statuses.pending')}</TabsTrigger>
          <TabsTrigger value="rejected">{t('admin.questions.statuses.rejected')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* list */}
      {isLoading ? (
        <SkeletonList count={4} className="h-40" />
      ) : questions.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardCheck} title={t('admin.questions.noQuestions')} />
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent>
                {/* meta row */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant[q.status]}>
                    {t(`admin.questions.statuses.${q.status}`)}
                  </Badge>
                  <Badge variant={difficultyVariant[q.difficulty]}>
                    {t(`tests.difficulty${q.difficulty.charAt(0).toUpperCase()}${q.difficulty.slice(1)}`)}
                  </Badge>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {q.subject} · {q.topic}
                  </span>
                  <span className="ml-auto flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {q.submittedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {q.submittedAt}
                    </span>
                  </span>
                </div>

                {q.status === 'rejected' && q.rejectReason && (
                  <p className="mb-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {q.rejectReason}
                  </p>
                )}

                {/* question + options */}
                <p className="text-[15px] font-semibold text-slate-800">{loc(q.text)}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                        i === q.correct
                          ? 'border-emerald-300 bg-emerald-50 font-medium text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold',
                          i === q.correct ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {optionLetters[i]}
                      </span>
                      <span className="min-w-0">{loc(o)}</span>
                      {i === q.correct && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0" />}
                    </div>
                  ))}
                </div>

                {/* explanation preview (sanitized) */}
                {q.explanation?.bn && (
                  <details className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-500">
                      {t('admin.questions.explanation')}
                    </summary>
                    <MarkdownContent
                      content={q.explanation.bn}
                      className="mt-2 text-sm text-slate-600"
                    />
                  </details>
                )}

                {/* actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setApproveTarget(q)}
                    disabled={q.status === 'approved' || approve.isPending}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {t('admin.questions.approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectTarget(q)}
                    disabled={q.status === 'rejected' || reject.isPending}
                  >
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                    {t('admin.questions.reject')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditTarget(q)}>
                    <Pencil className="h-3.5 w-3.5" />
                    {t('admin.questions.edit')}
                  </Button>
                  <span className="ml-auto text-xs text-slate-300">{q.id}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* approve confirm */}
      <Modal
        open={Boolean(approveTarget)}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title={t('admin.questions.approveConfirm')}
        description={approveTarget ? loc(approveTarget.text) : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproveTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="accent" onClick={handleApprove} loading={approve.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {t('admin.questions.approve')}
            </Button>
          </>
        }
      />

      {/* reject with reason */}
      <Modal
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title={t('admin.questions.rejectConfirm')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={reject.isPending}
              disabled={!rejectReason.trim()}
            >
              <XCircle className="h-4 w-4" />
              {t('admin.questions.reject')}
            </Button>
          </>
        }
      >
        <Textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('admin.circulars.rejectPlaceholder')}
          rows={3}
        />
      </Modal>

      {/* edit modal */}
      <Modal
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title={t('admin.questions.edit')}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} loading={update.isPending}>
              {update.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        {editTarget && (
          <div className="space-y-4">
            <Field label={`${t('admin.questions.questionText')} (EN)`}>
              <Textarea
                value={editForm.textEn}
                onChange={(e) => setEditForm((f) => ({ ...f, textEn: e.target.value }))}
                rows={2}
              />
            </Field>
            <Field label={`${t('admin.questions.questionText')} (BN)`}>
              <Textarea
                value={editForm.textBn}
                onChange={(e) => setEditForm((f) => ({ ...f, textBn: e.target.value }))}
                rows={2}
              />
            </Field>

            <div>
              <Label className="mb-2">{t('admin.questions.options')}</Label>
              <div className="space-y-2">
                {editForm.options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-sm font-bold text-slate-500">
                      {optionLetters[i]}
                    </span>
                    <Input
                      value={o.en}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          options: f.options.map((x, idx) =>
                            idx === i ? { ...x, en: e.target.value } : x
                          ),
                        }))
                      }
                      placeholder="English"
                      className="text-sm"
                    />
                    <Input
                      value={o.bn}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          options: f.options.map((x, idx) =>
                            idx === i ? { ...x, bn: e.target.value } : x
                          ),
                        }))
                      }
                      placeholder="বাংলা"
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Field label={t('admin.questions.correctOption')}>
              <RadioGroup
                value={String(editForm.correct)}
                onValueChange={(v) => setEditForm((f) => ({ ...f, correct: Number(v) }))}
                className="flex flex-wrap gap-4"
              >
                {optionLetters.map((l, i) => (
                  <label key={i} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <Radio value={String(i)} />
                    {l}
                  </label>
                ))}
              </RadioGroup>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('admin.questions.topic')}>
                <Input
                  value={editForm.topic}
                  onChange={(e) => setEditForm((f) => ({ ...f, topic: e.target.value }))}
                />
              </Field>
              <Field label={t('admin.questions.difficulty')}>
                <Select
                  value={editForm.difficulty}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, difficulty: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">
                      {t('tests.difficultyEasy')}
                    </SelectItem>
                    <SelectItem value="medium">
                      {t('tests.difficultyMedium')}
                    </SelectItem>
                    <SelectItem value="hard">
                      {t('tests.difficultyHard')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label={t('admin.questions.explanation')}>
              <Textarea
                value={editForm.explanationBn}
                onChange={(e) => setEditForm((f) => ({ ...f, explanationBn: e.target.value }))}
                rows={4}
                placeholder="**ধাপ ১:** ..."
              />
              <p className="mt-1 text-xs text-slate-400">
                {lang === 'bn' ? 'মার্কডাউন সমর্থিত — HTML স্যানিটাইজ করা হয়' : 'Markdown supported — HTML is sanitized'}
              </p>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
