import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mailService } from '@/services/mailService'

/** Mailbox queries — usable by any signed-in role. */

export function useInbox() {
  return useQuery({ queryKey: ['mail', 'inbox'], queryFn: mailService.inbox })
}

export function useSentMail() {
  return useQuery({ queryKey: ['mail', 'sent'], queryFn: mailService.sent })
}

export function useUnreadMail() {
  return useQuery({ queryKey: ['mail', 'unread'], queryFn: mailService.unreadCount })
}

/** People the current user is allowed to write to. */
export function useMailContacts() {
  return useQuery({ queryKey: ['mail', 'contacts'], queryFn: mailService.contacts })
}

export function useSendMail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => mailService.send(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mail'] }),
  })
}

export function useMarkMailRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => mailService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mail'] }),
  })
}
