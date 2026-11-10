import { describe, it, expect, beforeEach } from 'vitest'
import { useTestEngineStore } from './testEngineStore'

const makeTest = () => ({
  id: 'test-phy-01',
  title: { en: 'Physics', bn: 'পদার্থবিজ্ঞান' },
  questions: [
    { id: 'q1', text: { en: 'A', bn: 'ক' }, options: [], marks: 1, negative: 0.25 },
    { id: 'q2', text: { en: 'B', bn: 'খ' }, options: [], marks: 1, negative: 0.25 },
  ],
})

const state = () => useTestEngineStore.getState()

describe('testEngineStore (FR-7)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useTestEngineStore.getState().reset()
  })

  it('init seeds questions, timer and fresh state', () => {
    const test = makeTest()
    state().init({ attemptId: 'att-1', test, durationSec: 600 })

    expect(state().attemptId).toBe('att-1')
    expect(state().testId).toBe('test-phy-01')
    expect(state().questions).toHaveLength(2)
    expect(state().remainingSec).toBe(600)
    expect(state().answers).toEqual({})
    expect(state().submitted).toBe(false)
  })

  it('selectAnswer stores the choice and counts changes', () => {
    state().init({ attemptId: 'att-1', test: makeTest(), durationSec: 60 })

    state().selectAnswer('q1', 2)
    expect(state().answers.q1).toBe(2)
    expect(state().stats.q1.changes).toBe(1)

    state().selectAnswer('q1', 0)
    expect(state().answers.q1).toBe(0)
    expect(state().stats.q1.changes).toBe(2)
    expect(state().stats.q1.timeSpentSec).toBe(0)
  })

  it('tick decrements remaining time and accrues time on the current question', () => {
    state().init({ attemptId: 'att-1', test: makeTest(), durationSec: 10 })

    state().tick()
    state().tick()
    expect(state().remainingSec).toBe(8)
    expect(state().stats.q1.timeSpentSec).toBe(2)

    // switch to the second question; time now accrues there instead
    state().setCurrentIndex(1)
    state().tick()
    expect(state().stats.q1.timeSpentSec).toBe(2)
    expect(state().stats.q2.timeSpentSec).toBe(1)
  })

  it('never ticks below zero', () => {
    state().init({ attemptId: 'att-1', test: makeTest(), durationSec: 1 })
    state().tick()
    state().tick()
    expect(state().remainingSec).toBe(0)
  })

  it('toggleMarked flips the mark-for-review flag', () => {
    state().init({ attemptId: 'att-1', test: makeTest(), durationSec: 60 })
    expect(state().marked.q1).toBeUndefined()

    state().toggleMarked('q1')
    expect(state().marked.q1).toBe(true)

    state().toggleMarked('q1')
    expect(state().marked.q1).toBe(false)
  })

  it('markSubmitted flags manual vs auto submission', () => {
    state().init({ attemptId: 'att-1', test: makeTest(), durationSec: 60 })
    state().markSubmitted()
    expect(state().submitted).toBe(true)
    expect(state().autoSubmitted).toBe(false)

    useTestEngineStore.getState().reset()
    state().init({ attemptId: 'att-2', test: makeTest(), durationSec: 60 })
    state().markSubmitted(true)
    expect(state().autoSubmitted).toBe(true)
  })

  it('reset clears the whole attempt', () => {
    state().init({ attemptId: 'att-1', test: makeTest(), durationSec: 60 })
    state().selectAnswer('q1', 1)
    state().reset()

    expect(state().attemptId).toBeNull()
    expect(state().answers).toEqual({})
    expect(state().remainingSec).toBe(0)
    expect(state().submitted).toBe(false)
  })
})
