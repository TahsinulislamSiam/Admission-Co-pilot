import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Users, Search, Trash2, Eye, ShieldCheck } from 'lucide-react'
import { useAdminUsers, useAdminUser, useDeleteUser } from '../hooks/useAdmin'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/lib/utils'

/**
 * Every account in the database, with a details view and a guarded delete.
 * Deleting a user cascades their sessions, attempts and mail.
 */
export function AdminUsersPage() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [detailsId, setDetailsId] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  useDocumentTitle(t('admin.users.title'))
  const { data: users = [], isLoading } = useAdminUsers(q)
  const { data: details, isLoading: detailsLoading } = useAdminUser(detailsId)
  const deleteUser = useDeleteUser()

  const stats = useMemo(() => {
    const students = users.filter((u) => u.role !== 'admin').length
    return { total: users.length, students, admins: users.length - students }
  }, [users])

  const confirmDelete = () => {
    deleteUser.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success(t('admin.users.deleted'))
        setToDelete(null)
      },
      onError: (err) => {
        const code = err?.message || 'serverError'
        toast.error(t(`admin.users.errors.${code}`, t('admin.users.errors.serverError')))
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Users className="h-6 w-6 text-brand-600" />
            {t('admin.users.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('admin.users.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="brand">
            {t('admin.users.total', { count: stats.total })}
          </Badge>
          <Badge variant="default">
            {t('admin.users.students', { count: stats.students })}
          </Badge>
          <Badge variant="purple">
            {t('admin.users.admins', { count: stats.admins })}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder')}
              className="pl-9"
              aria-label={t('admin.users.searchPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : users.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={t('admin.users.emptyTitle')}
            description={t('admin.users.emptyBody')}
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>{t('admin.users.name')}</TH>
                <TH>{t('admin.users.email')}</TH>
                <TH className="hidden sm:table-cell">{t('admin.users.role')}</TH>
                <TH className="hidden md:table-cell">{t('admin.users.joined')}</TH>
                <TH className="text-right">{t('admin.users.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {users.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <p className="font-semibold text-slate-800">{u.name}</p>
                    {u.profile?.phone && (
                      <p className="text-xs text-slate-400">{u.profile.phone}</p>
                    )}
                  </TD>
                  <TD className="text-slate-600">{u.email}</TD>
                  <TD className="hidden sm:table-cell">
                    <Badge variant={u.role === 'admin' ? 'purple' : 'slate'}>
                      {u.role === 'admin' ? t('admin.users.roleAdmin') : t('admin.users.roleStudent')}
                    </Badge>
                  </TD>
                  <TD className="hidden md:table-cell text-xs text-slate-500">
                    {formatDate(u.createdAt, 'en')}
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailsId(u.id)}
                        aria-label={t('admin.users.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDelete(u)}
                        aria-label={t('admin.users.remove')}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* details */}
      <Modal
        open={Boolean(detailsId)}
        onOpenChange={(open) => !open && setDetailsId(null)}
        title={t('admin.users.detailsTitle')}
        description={details?.email}
      >
        {detailsLoading || !details ? (
          <SkeletonList count={4} />
        ) : (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Detail label={t('admin.users.name')} value={details.name} />
            <Detail label={t('admin.users.email')} value={details.email} />
            <Detail
              label={t('admin.users.role')}
              value={
                details.role === 'admin' ? t('admin.users.roleAdmin') : t('admin.users.roleStudent')
              }
            />
            <Detail label={t('admin.users.joined')} value={formatDate(details.createdAt, 'en')} />
            <Detail label={t('admin.users.attempts')} value={String(details.attempts ?? 0)} />
            <Detail
              label={t('admin.users.group')}
              value={details.profile?.group || '—'}
            />
            <Detail label={t('admin.users.hscGpa')} value={String(details.profile?.hscGpa ?? '—')} />
            <Detail label={t('admin.users.phone')} value={details.profile?.phone || '—'} />
          </dl>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDetailsId(null)}>
            {t('common.close')}
          </Button>
          {details && details.id !== 'u-admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDetailsId(null)
                setToDelete(details)
              }}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              {t('admin.users.remove')}
            </Button>
          )}
        </div>
      </Modal>

      {/* delete confirm */}
      <Modal
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t('admin.users.confirmTitle')}
        description={toDelete ? t('admin.users.confirmBody', { name: toDelete.name }) : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteUser.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              {deleteUser.isPending ? t('admin.users.removing') : t('admin.users.remove')}
            </Button>
          </>
        }
      />

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t('admin.users.footnote')}
      </p>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-700">{value}</dd>
    </div>
  )
}

export default AdminUsersPage
