import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/constants'

/**
 * Test engine state (FR-7). Persisted to sessionStorage so an accidental
 * refresh resumes the attempt instead of losing answers.
 *
 * Tracked per question: time spent (seconds) and number of answer changes,
 * both sent to the backend for mistake analysis (AI-5..AI-7).
 */
const initialState = {
  attemptId: null,
  testId: null,
  testTitle: null,
  questions: [], // [{ id, text:{en,bn}, options:[{en,bn}], marks, negative }]
  remainingSec: 0,
  currentIndex: 0,
  answers: {}, // qid -> selected option index
  marked: {}, // qid -> marked-for-review flag
  stats: {}, // qid -> { timeSpentSec, changes }
  startedAt: null,
  submitted: false,
  autoSubmitted: false,
}

export const useTestEngineStore = create(
  persist(
    (set) => ({
      ...initialState,

      /** Start a new attempt (wipes any previous state). */
      init: ({ attemptId, test, durationSec }) =>
        set({
          ...initialState,
          attemptId,
          testId: test.id,
          testTitle: test.title,
          questions: test.questions,
          remainingSec: durationSec,
          startedAt: Date.now(),
        }),

      setCurrentIndex: (i) => set({ currentIndex: i }),

      /** Record an answer selection; bumps the change counter for analytics. */
      selectAnswer: (qid, optionIndex) =>
        set((s) => {
          const prev = s.stats[qid] || { timeSpentSec: 0, changes: 0 }
          return {
            answers: { ...s.answers, [qid]: optionIndex },
            stats: { ...s.stats, [qid]: { ...prev, changes: prev.changes + 1 } },
          }
        }),

      toggleMarked: (qid) =>
        set((s) => ({ marked: { ...s.marked, [qid]: !s.marked[qid] } })),

      /** Called once per second by the engine; decrements timer and accrues
       * time-on-question for the currently visible question. */
      tick: () =>
        set((s) => {
          const q = s.questions[s.currentIndex]
          const qid = q?.id
          const prev = (qid && s.stats[qid]) || { timeSpentSec: 0, changes: 0 }
          return {
            remainingSec: Math.max(0, s.remainingSec - 1),
            stats: qid
              ? { ...s.stats, [qid]: { ...prev, timeSpentSec: prev.timeSpentSec + 1 } }
              : s.stats,
          }
        }),

      markSubmitted: (auto) => set({ submitted: true, autoSubmitted: Boolean(auto) }),

      /** Clear everything (called after successful submit / on exit). */
      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEYS.testEngine,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
