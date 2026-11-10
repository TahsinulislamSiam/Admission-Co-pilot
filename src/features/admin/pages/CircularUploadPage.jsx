import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FileUp,
  UploadCloud,
  Check,
  Loader2,
  FileText,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { useCirculars, useUploadCircular, useAllUniversities } from '../hooks/useAdmin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Field } from '@/components/ui/Input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useLocale } from '@/hooks/useLocale'
import { formatDate } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'

const statusVariant = { pending_review: 'warning', approved: 'success', rejected: 'danger' }

/** Pipeline step keys shown while "extracting". */
const STEP_KEYS = [
  'admin.circulars.progressUploading',
  'admin.circulars.progressOcr',
  'admin.circulars.progressParsing',
]

/**
 * AI-1 — circular upload. A PDF is uploaded; the backend runs the
 * extraction pipeline and returns an editable draft. Progress steps are
 * animated client-side while the request is in flight.
 */
export default function CircularUploadPage() {
  useDocumentTitle('admin.nav.circulars')
  const { t } = useTranslation()
  const { lang, loc } = useLocale()
  const navigate = useNavigate()

  const { data: universities = [] } = useAllUniversities()
  const { data: circulars = [], isLoading } = useCirculars()
  const upload = useUploadCircular()

  const [universityId, setUniversityId] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleBn, setTitleBn] = useState('')
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(-1) // -1 idle, 0..2 pipeline, 3 done
  const navigatedRef = useRef(false)

  // Advance the fake pipeline animation while the upload is in flight.
  useEffect(() => {
    if (!upload.isPending || step >= 2) return undefined
    const id = setTimeout(() => setStep((s) => Math.min(s + 1, 2)), 900)
    return () => clearTimeout(id)
  }, [upload.isPending, step])

  // Success -> show "done" then jump to the review screen.
  useEffect(() => {
    if (upload.isSuccess && !navigatedRef.current) {
      navigatedRef.current = true
      setStep(3)
      const id = setTimeout(() => {
        navigate(route(ROUTES.adminCircularReview, { id: upload.data.id }), { replace: true })
      }, 1100)
      return () => clearTimeout(id)
    }
    if (upload.isError) {
      setStep(-1)
      toast.error(upload.error?.message || t('common.errorDesc'))
    }
    return undefined
  }, [upload.isSuccess, upload.isError, upload.data, upload.error, navigate, t])

  const university = universities.find((u) => u.id === universityId)

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!university) errs.university = t('common.required')
    if (!titleEn.trim()) errs.title = t('common.required')
    if (!file) errs.file = t('common.required')
    setErrors(errs)
    if (Object.keys(errs).length) return

    navigatedRef.current = false
    setStep(0)
    upload.mutate({
      file,
      universityId: university.id,
      universityName: university.name,
      title: { en: titleEn.trim(), bn: titleBn.trim() || titleEn.trim() },
    })
  }

  const resetForm = () => {
    setUniversityId('')
    setTitleEn('')
    setTitleBn('')
    setFile(null)
    setErrors({})
  }

  const uploading = upload.isPending || step >= 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <FileUp className="h-5 w-5 text-brand-600" />
          {t('admin.circulars.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('admin.circulars.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* upload form */}
        <Card className="lg:col-span-2 self-start">
          <CardHeader>
            <CardTitle>{t('admin.circulars.uploadTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <Field label={t('admin.circulars.university')} error={errors.university}>
                <Select value={universityId} onValueChange={setUniversityId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.circulars.university')} />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {loc(u.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={`${t('admin.circulars.circularTitle')} (EN)`} error={errors.title}>
                <Input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Undergraduate Admission Circular 2026-27"
                  disabled={uploading}
                />
              </Field>

              <Field label={`${t('admin.circulars.circularTitle')} (BN)`}>
                <Input
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  placeholder="স্নাতক (সম্মান) ভর্তি বিজ্ঞপ্তি ২০২৬-২৭"
                  disabled={uploading}
                />
              </Field>

              <Field label={t('admin.circulars.pdfFile')} error={errors.file}>
                <Input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
                {file && !errors.file && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <FileText className="h-3 w-3" />
                    {file.name}
                  </p>
                )}
              </Field>

              {/* pipeline progress */}
              {step >= 0 && (
                <ol className="mb-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {STEP_KEYS.map((key, i) => {
                    const state = step > i || step === 3 ? 'done' : step === i ? 'active' : 'idle'
                    return (
                      <li key={key} className="flex items-center gap-2 text-sm">
                        {state === 'done' ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : state === 'active' ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        )}
                        <span
                          className={cn(
                            state === 'idle' ? 'text-slate-400' : 'font-medium text-slate-700'
                          )}
                        >
                          {t(key)}
                        </span>
                      </li>
                    )
                  })}
                  {step === 3 && (
                    <li className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <Check className="h-4 w-4" />
                      {t('admin.circulars.progressDone')}
                    </li>
                  )}
                </ol>
              )}

              <div className="flex gap-3">
                <Button type="submit" loading={uploading} className="flex-1">
                  {!uploading && <UploadCloud className="h-4 w-4" />}
                  {uploading ? t('admin.circulars.uploading') : t('admin.circulars.uploadCta')}
                </Button>
                {step < 0 && (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    {t('common.clearFilters')}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* uploaded circulars */}
        <Card className="lg:col-span-3 self-start">
          <CardHeader>
            <CardTitle>{t('admin.circulars.uploadedList')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonList count={3} className="h-12" />
            ) : circulars.length === 0 ? (
              <EmptyState icon={FileUp} title={t('admin.circulars.noCirculars')} />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>{t('admin.circulars.university')}</TH>
                    <TH>{t('admin.circulars.circularTitle')}</TH>
                    <TH className="hidden md:table-cell">{t('admin.records.lastVerified')}</TH>
                    <TH>{t('admin.questions.statusFilter')}</TH>
                    <TH />
                  </TR>
                </THead>
                <TBody>
                  {circulars.map((c) => (
                    <TR key={c.id}>
                      <TD className="font-medium text-slate-800">{loc(c.universityName)}</TD>
                      <TD className="max-w-[220px] truncate">{loc(c.title)}</TD>
                      <TD className="hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {formatDate(c.uploadedAt, lang)}
                        </span>
                      </TD>
                      <TD>
                        <Badge variant={statusVariant[c.status]}>
                          {t(`admin.circulars.statuses.${c.status}`)}
                        </Badge>
                      </TD>
                      <TD>
                        <Link to={route(ROUTES.adminCircularReview, { id: c.id })}>
                          <Button size="sm" variant={c.status === 'pending_review' ? 'secondary' : 'outline'}>
                            {t('admin.circulars.review')}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
