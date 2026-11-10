import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Database,
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react'
import {
  useAllUniversities,
  useCreateUniversity,
  useUpdateUniversity,
  useDeleteUniversity,
} from '../hooks/useAdmin'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label, Field } from '@/components/ui/Input'
import { Switch, CheckboxRow } from '@/components/ui/FormControls'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { SourceLink } from '@/components/common/SourceLink'
import { useLocale } from '@/hooks/useLocale'
import { formatDate } from '@/lib/utils'
import { GROUPS, GROUP_LABELS } from '@/lib/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const emptyForm = {
  nameEn: '',
  nameBn: '',
  type: 'public',
  city: 'Dhaka',
  established: '2020',
  website: '',
  sourceUrl: '',
  minSscGpa: '',
  minHscGpa: '',
  applicationFee: '',
  deadline: '',
  examDate: '',
  published: false,
  groups: [],
}

/**
 * Admin — university records CRUD with publish control (FR-4).
 * Unpublished records are hidden from students but editable here.
 */
export default function RecordsPage() {
  useDocumentTitle('admin.nav.universities')
  const { t } = useTranslation()
  const { loc } = useLocale()

  const { data: universities = [], isLoading } = useAllUniversities()
  const create = useCreateUniversity()
  const update = useUpdateUniversity()
  const remove = useDeleteUniversity()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [publishFilter, setPublishFilter] = useState('all')
  const [form, setForm] = useState(null) // null = closed, otherwise form object
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [errors, setErrors] = useState({})

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return universities.filter((u) => {
      if (typeFilter !== 'all' && u.type !== typeFilter) return false
      if (publishFilter === 'published' && u.published === false) return false
      if (publishFilter === 'unpublished' && u.published !== false) return false
      if (!q) return true
      return (
        (u.name?.en || '').toLowerCase().includes(q) ||
        (u.name?.bn || '').includes(search.trim()) ||
        (u.city?.en || '').toLowerCase().includes(q)
      )
    })
  }, [universities, search, typeFilter, publishFilter])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setErrors({})
  }

  const openEdit = (u) => {
    setEditingId(u.id)
    setForm({
      nameEn: u.name?.en || '',
      nameBn: u.name?.bn || '',
      type: u.type || 'public',
      city: u.city?.en || '',
      established: String(u.established || ''),
      website: u.website || '',
      sourceUrl: u.sourceUrl || '',
      minSscGpa: u.minSscGpa != null ? String(u.minSscGpa) : '',
      minHscGpa: u.minHscGpa != null ? String(u.minHscGpa) : '',
      applicationFee: u.applicationFee != null ? String(u.applicationFee) : '',
      deadline: u.deadline || '',
      examDate: u.examDate || '',
      published: u.published !== false,
      groups: u.groups || [],
    })
    setErrors({})
  }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const toggleGroup = (g) =>
    setForm((f) => ({
      ...f,
      groups: f.groups.includes(g) ? f.groups.filter((x) => x !== g) : [...f.groups, g],
    }))

  const handleSubmit = async () => {
    const errs = {}
    if (!form.nameEn.trim()) errs.nameEn = t('common.required')
    if (!form.nameBn.trim()) errs.nameBn = t('common.required')
    setErrors(errs)
    if (Object.keys(errs).length) return

    const payload = {
      nameEn: form.nameEn.trim(),
      nameBn: form.nameBn.trim(),
      city: form.city.trim(),
      established: Number(form.established) || 2020,
      website: form.website.trim(),
      sourceUrl: form.sourceUrl.trim(),
      published: form.published,
      groups: form.groups,
    }
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, payload })
        toast.success(t('admin.records.updated'))
      } else {
        await create.mutateAsync({
          ...payload,
          type: form.type,
          minSscGpa: Number(form.minSscGpa) || 0,
          minHscGpa: Number(form.minHscGpa) || 0,
          applicationFee: Number(form.applicationFee) || 0,
          deadline: form.deadline || null,
          examDate: form.examDate || null,
        })
        toast.success(t('admin.records.created'))
      }
      setForm(null)
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  const togglePublished = async (u) => {
    const next = !(u.published !== false)
    try {
      await update.mutateAsync({ id: u.id, payload: { published: next } })
      toast.success(next ? t('admin.records.published') : t('admin.records.unpublished'))
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  const markVerified = async (u) => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      await update.mutateAsync({ id: u.id, payload: { lastVerified: today } })
      toast.success(t('universities.verifiedOn'))
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(deleteTarget.id)
      toast.success(t('admin.records.deleted'))
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e.message || t('common.errorDesc'))
    }
  }

  const busy = create.isPending || update.isPending

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Database className="h-5 w-5 text-brand-600" />
            {t('admin.records.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('admin.records.subtitle')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('admin.records.create')}
        </Button>
      </div>

      {/* filters */}
      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('universities.searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="public">{t('admin.records.typePublic')}</SelectItem>
              <SelectItem value="private">{t('admin.records.typePrivate')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={publishFilter} onValueChange={setPublishFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.records.publishedLabel')}: {t('common.all')}</SelectItem>
              <SelectItem value="published">{t('admin.records.published')}</SelectItem>
              <SelectItem value="unpublished">{t('admin.records.unpublished')}</SelectItem>
            </SelectContent>
          </Select>
          {(search || typeFilter !== 'all' || publishFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setTypeFilter('all')
                setPublishFilter('all')
              }}
            >
              <X className="h-3.5 w-3.5" />
              {t('common.clearFilters')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* table */}
      {isLoading ? (
        <SkeletonList count={5} className="h-14" />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title={t('universities.noResults')}
            description={t('universities.noResultsDesc')}
          />
        </Card>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t('admin.records.nameEn')}</TH>
              <TH>{t('admin.records.type')}</TH>
              <TH className="hidden md:table-cell">{t('common.city')}</TH>
              <TH className="hidden lg:table-cell">{t('admin.records.sourceUrl')}</TH>
              <TH className="hidden sm:table-cell">{t('admin.records.lastVerified')}</TH>
              <TH>{t('admin.records.publishedLabel')}</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {filtered.map((u) => (
              <TR key={u.id}>
                <TD>
                  <p className="font-semibold text-slate-800">{u.name?.en}</p>
                  <p className="text-xs text-slate-400">{u.name?.bn}</p>
                </TD>
                <TD>
                  <Badge variant={u.type === 'public' ? 'brand' : 'purple'}>
                    {u.type === 'public' ? t('admin.records.typePublic') : t('admin.records.typePrivate')}
                  </Badge>
                </TD>
                <TD className="hidden md:table-cell">{u.city?.en || '—'}</TD>
                <TD className="hidden lg:table-cell">
                  <SourceLink url={u.sourceUrl} compact />
                </TD>
                <TD className="hidden sm:table-cell text-xs">
                  {u.lastVerified ? formatDate(u.lastVerified, 'en') : '—'}
                </TD>
                <TD>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <Switch
                      checked={u.published !== false}
                      onCheckedChange={() => togglePublished(u)}
                      disabled={update.isPending}
                    />
                    {u.published !== false ? t('admin.records.published') : t('admin.records.unpublished')}
                  </label>
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markVerified(u)}
                      disabled={update.isPending}
                      title={t('universities.verifiedOn')}
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title={t('common.edit')}>
                      <Pencil className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(u)}
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {/* create / edit modal */}
      <Modal
        open={Boolean(form)}
        onOpenChange={(open) => !open && setForm(null)}
        title={editingId ? t('admin.records.editTitle') : t('admin.records.createTitle')}
        className="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} loading={busy}>
              {busy ? t('common.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('admin.records.nameEn')} error={errors.nameEn}>
              <Input value={form.nameEn} onChange={(e) => setField('nameEn', e.target.value)} />
            </Field>
            <Field label={t('admin.records.nameBn')} error={errors.nameBn}>
              <Input value={form.nameBn} onChange={(e) => setField('nameBn', e.target.value)} />
            </Field>

            <Field label={t('admin.records.type')}>
              <Select
                value={form.type}
                onValueChange={(v) => setField('type', v)}
                disabled={Boolean(editingId)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t('admin.records.typePublic')}</SelectItem>
                  <SelectItem value="private">{t('admin.records.typePrivate')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('common.city')}>
              <Input value={form.city} onChange={(e) => setField('city', e.target.value)} />
            </Field>

            <Field label={t('universities.established')}>
              <Input
                type="number"
                value={form.established}
                onChange={(e) => setField('established', e.target.value)}
              />
            </Field>
            <Field label={t('admin.records.website')}>
              <Input
                type="url"
                value={form.website}
                onChange={(e) => setField('website', e.target.value)}
                placeholder="https://..."
              />
            </Field>

            <Field label={t('admin.records.sourceUrl')} className="sm:col-span-2">
              <Input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setField('sourceUrl', e.target.value)}
                placeholder="https://..."
              />
            </Field>

            {!editingId && (
              <>
                <Field label={t('admin.circulars.minSsc')}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={form.minSscGpa}
                    onChange={(e) => setField('minSscGpa', e.target.value)}
                  />
                </Field>
                <Field label={t('admin.circulars.minHsc')}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={form.minHscGpa}
                    onChange={(e) => setField('minHscGpa', e.target.value)}
                  />
                </Field>
                <Field label={t('common.fee')}>
                  <Input
                    type="number"
                    min="0"
                    value={form.applicationFee}
                    onChange={(e) => setField('applicationFee', e.target.value)}
                  />
                </Field>
                <Field label={t('common.deadline')}>
                  <Input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setField('deadline', e.target.value)}
                  />
                </Field>
                <Field label={t('common.examDate')}>
                  <Input
                    type="date"
                    value={form.examDate}
                    onChange={(e) => setField('examDate', e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Label className="mb-2">{t('universities.groups')}</Label>
                  <div className="flex flex-wrap gap-4">
                    {GROUPS.map((g) => (
                      <CheckboxRow
                        key={g}
                        id={`group-${g}`}
                        label={loc(GROUP_LABELS[g])}
                        checked={form.groups.includes(g)}
                        onCheckedChange={() => toggleGroup(g)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <label className="flex items-center gap-3 text-sm font-medium text-slate-700 sm:col-span-2">
              <Switch
                checked={form.published}
                onCheckedChange={(v) => setField('published', v)}
              />
              {t('admin.records.publishToggle')}
            </label>
          </div>
        )}
      </Modal>

      {/* delete confirmation */}
      <Modal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('admin.records.deleteConfirmTitle')}
        description={t('admin.records.deleteConfirmBody', {
          name: deleteTarget?.name?.en || '',
        })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={remove.isPending}>
              <Trash2 className="h-4 w-4" />
              {t('common.delete')}
            </Button>
          </>
        }
      />
    </div>
  )
}
