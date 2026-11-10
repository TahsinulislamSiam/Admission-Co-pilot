import { create } from 'zustand'

let nextId = 1

/**
 * Assistant chat state — history lives in the session only (memory),
 * matching the proposal: "chat history in the session".
 */
export const useAssistantStore = create((set) => ({
  messages: [], // [{ id, role:'user'|'assistant', content, sources, status:'pending'|'done'|'error' }]
  pending: false,

  addUserMessage: (content) =>
    set((s) => ({
      pending: true,
      messages: [
        ...s.messages,
        { id: `m${nextId++}`, role: 'user', content, status: 'done', sources: [] },
      ],
    })),

  addPendingReply: () =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: `m${nextId++}`, role: 'assistant', content: '', status: 'pending', sources: [] },
      ],
    })),

  /** Fill in the pending assistant reply (success or error). */
  resolvePendingReply: ({ content, sources, status }) =>
    set((s) => ({
      pending: false,
      messages: s.messages.map((m) =>
        m.status === 'pending' ? { ...m, content, sources: sources || [], status } : m
      ),
    })),

  /** Allow retrying the last failed assistant reply. */
  retryLast: () =>
    set((s) => {
      const messages = [...s.messages]
      const lastPendingIdx = messages.map((m) => m.status).lastIndexOf('pending')
      if (lastPendingIdx >= 0) messages.splice(lastPendingIdx, 1)
      const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user')
      if (lastUserIdx >= 0) messages.splice(lastUserIdx + 1)
      return { pending: true, messages }
    }),

  clear: () => set({ messages: [], pending: false }),
}))
