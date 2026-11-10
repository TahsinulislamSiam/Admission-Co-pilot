import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, profileSchema, gpaSchema } from './validation'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const r = loginSchema.safeParse({ email: 'student@example.com', password: 'password123' })
    expect(r.success).toBe(true)
  })

  it('requires an email', () => {
    const r = loginSchema.safeParse({ email: '', password: 'x' })
    expect(r.success).toBe(false)
    expect(r.error.issues[0].message).toBe('emailRequired')
  })

  it('rejects a malformed email', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: 'x' })
    expect(r.success).toBe(false)
    expect(r.error.issues[0].message).toBe('emailInvalid')
  })

  it('requires a password', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '' })
    expect(r.success).toBe(false)
    expect(r.error.issues[0].message).toBe('passwordRequired')
  })
})

describe('gpaSchema (FR-1: 0–5, two decimals)', () => {
  it.each(['0', '5', '3', '3.75', '4.25'])('accepts %s', (v) => {
    expect(gpaSchema.safeParse(v).success).toBe(true)
  })

  it.each(['-0.01', '5.01', '6', '-1'])('rejects out-of-range %s', (v) => {
    const r = gpaSchema.safeParse(v)
    expect(r.success).toBe(false)
    expect(r.error.issues[0].message).toBe('gpaRange')
  })

  it('rejects garbage input', () => {
    const r = gpaSchema.safeParse('abc')
    expect(r.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const base = {
    name: 'Rahim Uddin',
    email: 'rahim@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  }

  it('accepts a valid registration', () => {
    const r = registerSchema.safeParse({ ...base, sscGpa: '4.5', hscGpa: '4.2', group: 'science' })
    expect(r.success).toBe(true)
  })

  it('flags a short name', () => {
    const r = registerSchema.safeParse({ ...base, name: 'ab' })
    expect(r.success).toBe(false)
    expect(r.error.issues[0].message).toBe('nameMin')
  })

  it('flags mismatched passwords', () => {
    const r = registerSchema.safeParse({ ...base, confirmPassword: 'different' })
    expect(r.success).toBe(false)
    expect(
      r.error.issues.find((i) => i.path[0] === 'confirmPassword')?.message
    ).toBe('confirmMatch')
  })

  it('flags an out-of-range HSC GPA', () => {
    const r = registerSchema.safeParse({ ...base, hscGpa: '5.5' })
    expect(r.success).toBe(false)
    expect(r.error.issues[0].message).toBe('gpaRange')
  })
})

describe('profileSchema', () => {
  const valid = {
    name: 'Tanvir Ahmed',
    sscGpa: '4.5',
    hscGpa: '4.2',
    group: 'science',
    budget: '500000',
  }

  it('accepts a complete profile and applies defaults', () => {
    const r = profileSchema.parse(valid)
    expect(r.preferredSubjects).toEqual([])
    expect(r.needsHostel).toBe(false)
    expect(r.hscGpa).toBeCloseTo(4.2)
  })

  it('rejects GPA above 5', () => {
    const r = profileSchema.safeParse({ ...valid, hscGpa: '5.2' })
    expect(r.success).toBe(false)
  })

  it('rejects GPA below 0', () => {
    const r = profileSchema.safeParse({ ...valid, sscGpa: '-1' })
    expect(r.success).toBe(false)
  })

  it('rejects an invalid group', () => {
    const r = profileSchema.safeParse({ ...valid, group: 'vocational' })
    expect(r.success).toBe(false)
  })

  it('rejects a negative budget', () => {
    const r = profileSchema.safeParse({ ...valid, budget: '-5' })
    expect(r.success).toBe(false)
  })
})
