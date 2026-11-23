import { useTranslation } from 'react-i18next'
import { MailboxView } from '@/features/mail/components/MailboxView'
import { useMailContacts } from '@/features/mail/hooks/useMail'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/**
 * Admin mailbox. Uses the same view as the student page; the contacts endpoint
 * returns every account for admins, so notices can go to any user.
 */
export function AdminMailPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('mail.title'))
  const { data: contacts = [] } = useMailContacts()

  return <MailboxView contacts={contacts} subtitleKey="mail.subtitleAdmin" />
}

export default AdminMailPage
