import { useTranslation } from 'react-i18next'
import { MailboxView } from '@/features/mail/components/MailboxView'
import { useMailContacts } from '@/features/mail/hooks/useMail'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Student mailbox: read notices from admins, reply, or write a new message. */
export function StudentMailPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('mail.title'))
  const { data: contacts = [] } = useMailContacts()

  return <MailboxView contacts={contacts} subtitleKey="mail.subtitleStudent" />
}

export default StudentMailPage
