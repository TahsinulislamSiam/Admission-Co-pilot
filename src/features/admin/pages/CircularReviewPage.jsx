import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  FileSearch,
  FileText,
  Save,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react'
import {
  useCircular,
  useSaveCircularDraft,
  useApproveCircular,
  useRejectCircular,
} from '../hooks/useAdmin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useLocale } from '@/hooks/useLocale'
import { formatDate } from '@/lib/utils'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const statusVariant = { pending_review: 'warning', approved: 'success', rejected: 'danger' }

const emptyDraft = {
  applicationStart: '',
  applicationDeadline: '',
  examDate: '',
  minSscGpa: '',
  minHscGpa: '',
  applicationFee: '',
  departments: [],
}

/**
 * AI-1 — draft review. The original (extracted) text sits beside an
 * editable form of the parsed fields; an admin verifies everything before
 * approving & publishing or rejecting with a reason.
 */
export default function CircularReviewPage() {
  useDocumentTitle('admin.circulars.reviewTitle')
  const { id } = useParams()
  const { t } = useTranslation()
  const { lang, loc } = useLocale()
  const navigate = useNavigate()

  const { data: circular, isLoading, isError } = useCircular(id)
  const saveDraft = useSaveCircularDraft()
  const approve = useApproveCircular()
  const reject = useRejectCircular()

  const [draft, setDraft] = useState(emptyDraft)
  const [showApprove, setShowApprove] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Load the server draft into local state once.
  useEffect(() => {
    if (!circular) return
    const e = circular.extracted || {}
    setDraft({
      applicationStart: e.applicationStart || '',
      applicationDeadline: e.applicationDeadline || '',
      examDate: e.examDate || '',
      minSscGpa: e.minSscGpa ?? '',
      minHscGpa: e.minHscGpa ?? '',
      applicationFee: e.applicationFee ?? '',
      departments: (e.departments || []).map((d) => ({
        name: { en: d.name?.en || '', bn: d.name?.bn || '' },
        seats: d.seats ?? 0,
      })),
    })
    setRejectReason('')
  }, [circular?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <SkeletonList count={4} className="h-28" />

  if (isError || !circular) {
    return (
      <Card className="mx-auto max-w-2xl">
        <EmptyState
          icon={FileSearch}
          title={t('common.error')}
          description={t('common.errorDesc')}
          action={
            <Link to={ROUTES.adminCirculars}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                {t('common.back')}
              </Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  const setDept = (i, key, value) =>
    setDraft((d) => ({
      ...d,
      departments: d.departments.map((dept, idx) =>
        idx === i ? { ...dept, [key]: value } : dept
      ),
    }))

  const addDepartment = () =>
    setDraft((d) => ({
      ...d,
      departments: [...d.departments, { name: { en: '', bn: '' }, seats: 0 }],
    }))

  const removeDepartment = (i) =>
    setDraft((d) => ({ ...d, departments: d.departments.filter((_, idx) => idx !== i) }))

  const payload = () => ({
    extracted: {
      applicationStart: draft.applicationStart || null,
      applicationDeadline: draft.applicationDeadline || null,
      examDate: draft.examDate || null,
      minSscGpa: Number(draft.minSscGpa) || 0,
      minHscGpa: Number(draft.minHscGpa) || 0,
      applicationFee: Number(draft.applicationFee) || 0,
      departments: draft.departments
        .filter((d) => d.name.en.trim() || d.name.bn.trim())
        .map((d) => ({ name: d.name, seats: Number(d.seats) || 0 })),
    },
  })

  const handleSaveDraft = async () => {
    try {
      await saveDraft.mutateAsync({ id, payload: payload() })
      toast.success(t('admin.circulars.saved'))
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  const handleApprove = async () => {
    try {
      // Save any pending edits first, then publish.
      await saveDraft.mutateAsync({ id, payload: payload() })
      await approve.mutateAsync(id)
      toast.success(t('admin.circulars.approved'))
      navigate(ROUTES.adminCirculars, { replace: true })
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    try {
      await reject.mutateAsync({ id, reason: rejectReason.trim() })
      toast.success(t('admin.circulars.rejected'))
      navigate(ROUTES.adminCirculars, { replace: true })
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  const isPending = circular.status === 'pending_review'
  const busy = saveDraft.isPending || approve.isPending || reject.isPending

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to={ROUTES.adminCirculars}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FileSearch className="h-5 w-5 text-brand-600" />
            {t('admin.circulars.reviewTitle')}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{t('admin.circulars.reviewSubtitle')}</p>
        </div>
        <Badge variant={statusVariant[circular.status]}>
          {t(`admin.circulars.statuses.${circular.status}`)}
        </Badge>
      </div>

      {/* meta strip */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <FileText className="h-4 w-4 text-brand-600" />
            {loc(circular.universityName) || '—'}
          </span>
          <span className="truncate">{loc(circular.title) || circular.fileName}</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {formatDate(circular.uploadedAt, lang)} · {circular.fileName}
          </span>
        </CardContent>
      </Card>

      {circular.status === 'rejected' && circular.rejectReason && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <strong>{t('admin.circulars.rejectTitle')}:</strong> {circular.rejectReason}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* left — original text */}
        <Card className="self-start">
          <CardHeader>
            <CardTitle>{t('admin.circulars.originalPanel')}</CardTitle>
            <p className="mt-0.5 text-xs font-normal text-slate-400">
              {t('admin.circulars.originalText')}
            </p>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[560px] overflow-y-auto scrollbar-slim whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-700">
              {circular.rawText?.[lang] || circular.rawText?.en || '—'}
            </pre>
          </CardContent>
        </Card>

        {/* right — editable draft */}
        <Card className="self-start">
          <CardHeader>
            <CardTitle>{t('admin.circulars.draftPanel')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* dates */}
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('admin.circulars.datesSection')}
            </h4>
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <div>
                <Label>{t('admin.circulars.applicationStart')}</Label>
                <Input
                  type="date"
                  value={draft.applicationStart}
                  onChange={(e) => setField('applicationStart', e.target.value)}
                />
              </div>
              <div>
                <Label>{t('admin.circulars.applicationDeadline')}</Label>
                <Input
                  type="date"
                  value={draft.applicationDeadline}
                  onChange={(e) => setField('applicationDeadline', e.target.value)}
                />
              </div>
              <div>
                <Label>{t('admin.circulars.examDate')}</Label>
                <Input
                  type="date"
                  value={draft.examDate}
                  onChange={(e) => setField('examDate', e.target.value)}
                />
              </div>
            </div>

            {/* eligibility + fees */}
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('admin.circulars.eligibilitySection')}
              {' · '}
              {t('admin.circulars.feesSection')}
            </h4>
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <div>
                <Label>{t('admin.circulars.minSsc')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={draft.minSscGpa}
                  onChange={(e) => setField('minSscGpa', e.target.value)}
                />
              </div>
              <div>
                <Label>{t('admin.circulars.minHsc')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={draft.minHscGpa}
                  onChange={(e) => setField('minHscGpa', e.target.value)}
                />
              </div>
              <div>
                <Label>{t('admin.circulars.applicationFee')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.applicationFee}
                  onChange={(e) => setField('applicationFee', e.target.value)}
                />
              </div>
            </div>

            {/* departments */}
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('admin.circulars.departmentsSection')}
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={addDepartment}>
                <Plus className="h-3.5 w-3.5" />
                {t('admin.circulars.addDepartment')}
              </Button>
            </div>
            <div className="space-y-3">
              {draft.departments.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
                  {t('admin.circulars.noCirculars')}
                </p>
              )}
              {draft.departments.map((d, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_100px_36px] sm:items-end"
                >
                  <div>
                    <Label className="text-xs">{t('admin.records.nameEn')}</Label>
                    <Input
                      value={d.name.en}
                      onChange={(e) => setDept(i, 'name', { ...d.name, en: e.target.value })}
                      placeholder="A Unit — Science"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t('admin.records.nameBn')}</Label>
                    <Input
                      value={d.name.bn}
                      onChange={(e) => setDept(i, 'name', { ...d.name, bn: e.target.value })}
                      placeholder="ক ইউনিট — বিজ্ঞান"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t('admin.circulars.seats')}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={d.seats}
                      onChange={(e) => setDept(i, 'seats', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDepartment(i)}
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              ))}
            </div>

            {/* actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <Button variant="outline" onClick={handleSaveDraft} loading={saveDraft.isPending}>
                {!saveDraft.isPending && <Save className="h-4 w-4" />}
                {t('admin.circulars.saveDraft')}
              </Button>
              {isPending && (
                <>
                  <Button
                    className="ml-auto"
                    variant="accent"
                    onClick={() => setShowApprove(true)}
                    disabled={busy}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t('admin.circulars.approvePublish')}
                  </Button>
                  <Button variant="danger" onClick={() => setShowReject(true)} disabled={busy}>
                    <XCircle className="h-4 w-4" />
                    {t('admin.circulars.reject')}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* approve confirmation */}
      <Modal
        open={showApprove}
        onOpenChange={setShowApprove}
        title={t('admin.circulars.approveConfirmTitle')}
        description={t('admin.circulars.approveConfirmBody')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowApprove(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="accent" onClick={handleApprove} loading={approve.isPending}>
              {approve.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {t('admin.circulars.approvePublish')}
            </Button>
          </>
        }
      />

      {/* reject with reason */}
      <Modal
        open={showReject}
        onOpenChange={setShowReject}
        title={t('admin.circulars.rejectTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReject(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={reject.isPending}
              disabled={!rejectReason.trim()}
            >
              <XCircle className="h-4 w-4" />
              {t('admin.circulars.reject')}
            </Button>
          </>
        }
      >
        <Textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('admin.circulars.rejectPlaceholder')}
          rows={4}
        />
      </Modal>
    </div>
  )
}
