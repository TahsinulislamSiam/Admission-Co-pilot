/**
 * Result & analytics engine (AI-5..AI-7).
 *
 * Pure functions over (test, attempt) — computed by the mock API and returned
 * to the UI. When a real backend exists, this logic moves server-side and the
 * UI keeps consuming the same response shape.
 */
import { tests as allTests } from '../seed/tests'

const allTestById = (id) => allTests.find((t) => t.id === id) || null

/** Full grading + analytics for a submitted attempt. */
export function buildResult(test, attempt) {
  const qs = test.questions || []
  const answers = attempt.answers || {}
  const stats = attempt.stats || {}
  const labels = attempt.labels || {}

  let correct = 0
  let wrong = 0
  let unanswered = 0
  let positive = 0
  let negative = 0
  const review = []

  for (const q of qs) {
    const sel = answers[q.id]
    const stat = stats[q.id] || { timeSpentSec: 0, changes: 0 }
    const isCorrect = sel !== undefined && sel === q.correct
    const isWrong = sel !== undefined && sel !== q.correct
    const isSkipped = sel === undefined

    if (isCorrect) {
      correct += 1
      positive += q.marks
    } else if (isWrong) {
      wrong += 1
      negative += q.negative
    } else {
      unanswered += 1
    }

    // Infer a mistake label if the student has not chosen one yet
    let label = labels[q.id] || null
    if (isWrong && !label) label = inferMistakeLabel(stat)

    review.push({
      questionId: q.id,
      selectedIndex: isSkipped ? null : sel,
      correctIndex: q.correct,
      isCorrect,
      isSkipped,
      label: isCorrect ? null : label,
      stat,
    })
  }

  const score = Math.round((positive - negative) * 100) / 100
  const totalMarks = qs.reduce((sum, q) => sum + q.marks, 0)

  // Strategy simulation (AI-7): answer-everything vs answer-only-when-confident
  const actual = score
  const confidentOnly = simulateConfidentOnly(review, qs)
  const strategyDiff = Math.round((confidentOnly - actual) * 100) / 100

  return {
    attemptId: attempt.id,
    testId: test.id,
    submittedAt: attempt.submittedAt || new Date().toISOString(),
    durationUsedSec: attempt.durationUsedSec ?? 0,
    autoSubmitted: Boolean(attempt.autoSubmitted),
    totals: {
      questions: qs.length,
      correct,
      wrong,
      unanswered,
      positiveMarks: positive,
      penaltyMarks: Math.round(negative * 100) / 100,
      totalMarks,
      score,
      percentage: totalMarks ? Math.round((Math.max(0, score) / totalMarks) * 100) : 0,
      accuracy: correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0,
    },
    strategyComparison: {
      answerEverything: actual,
      confidentOnly,
      diff: strategyDiff,
    },
    review,
  }
}

/**
 * Mistake label heuristics (AI-6):
 *  - answered in a rush with many changes  -> guess
 *  - very quick answer, wrong              -> careless
 *  - long time spent, still wrong          -> concept gap
 *  - answered near the end of time budget  -> time pressure
 */
function inferMistakeLabel(stat) {
  const { timeSpentSec = 0, changes = 0 } = stat
  if (changes >= 3) return 'guess'
  if (timeSpentSec <= 20 && changes <= 1) return 'careless'
  if (timeSpentSec >= 90) return 'concept'
  return 'time'
}

/** Score the student would get answering only "confident" questions. */
function simulateConfidentOnly(review, qs) {
  // Heuristic: a question is "confident" when answered without multiple changes
  // (changes <= 1) and within a reasonable time (not a blind guess).
  let score = 0
  const qMap = new Map(qs.map((q) => [q.id, q]))
  for (const r of review) {
    const q = qMap.get(r.questionId)
    if (!q) continue
    const confident = r.selectedIndex !== null && r.stat.changes <= 1
    if (!confident) continue
    if (r.isCorrect) score += q.marks
  }
  return Math.round(score * 100) / 100
}

/** Dashboard analytics aggregated over all attempts of a user. */
export function buildDashboardAnalytics(userAttempts) {
  const history = []
  const weakTopics = {}
  const mistakeCounts = { concept: 0, careless: 0, time: 0, guess: 0 }

  for (const att of userAttempts) {
    const test = allTestById(att.testId)
    if (!test) continue
    const result = buildResult(test, att)

    history.push({
      attemptId: att.id,
      testId: test.id,
      label: test.subject,
      title: test.title,
      date: att.submittedAt,
      percentage: result.totals.percentage,
    })

    for (const r of result.review) {
      if (r.isCorrect) continue
      const q = test.questions.find((x) => x.id === r.questionId)
      if (!q) continue
      const key = q.topic
      weakTopics[key] = weakTopics[key] || {
        topic: key,
        subject: q.subject,
        wrong: 0,
        attempts: 0,
      }
      weakTopics[key].wrong += 1
      if (r.label) mistakeCounts[r.label] += 1
    }
  }

  const topics = Object.values(weakTopics).sort((a, b) => b.wrong - a.wrong).slice(0, 6)

  return {
    history: history.sort((a, b) => new Date(a.date) - new Date(b.date)),
    weakTopics: topics.map((t) => ({
      ...t,
      topicLabel: t.topic,
    })),
    mistakeCounts,
    testsTaken: history.length,
    avgScore: history.length
      ? Math.round(history.reduce((s, h) => s + h.percentage, 0) / history.length)
      : 0,
    bestScore: history.length ? Math.max(...history.map((h) => h.percentage)) : 0,
    lastScore: history.length ? history[history.length - 1].percentage : 0,
  }
}
