import { z } from 'zod'

/** FR-1 — GPA must be 0–5 with up to 2 decimals. */
export const gpaSchema = z.coerce
  .number({ invalid_type_error: 'gpaRequired' })
  .min(0, 'gpaRange')
  .max(5, 'gpaRange')
  .step(0.01, 'gpaRange')

export const budgetSchema = z.coerce
  .number({ invalid_type_error: 'budgetMin' })
  .min(0, 'budgetMin')
  .max(10000000, 'budgetMax')

/** Login form */
export const loginSchema = z.object({
  email: z.string().min(1, 'emailRequired').email('emailInvalid'),
  password: z.string().min(1, 'passwordRequired'),
})

/** Register form */
export const registerSchema = z
  .object({
    name: z.string().min(3, 'nameMin'),
    email: z.string().min(1, 'emailRequired').email('emailInvalid'),
    password: z.string().min(8, 'passwordMin'),
    confirmPassword: z.string(),
    sscGpa: gpaSchema.optional(),
    hscGpa: gpaSchema.optional(),
    group: z.enum(['science', 'commerce', 'arts']).optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'confirmMatch',
  })

/** Forgot password form */
export const forgotSchema = z.object({
  email: z.string().min(1, 'emailRequired').email('emailInvalid'),
})

/** Profile form (FR-1) — GPA 0-5, group, budget, preferences. */
export const profileSchema = z.object({
  name: z.string().min(3, 'nameMin'),
  phone: z.string().optional(),
  sscGpa: gpaSchema,
  hscGpa: gpaSchema,
  group: z.enum(['science', 'commerce', 'arts'], { errorMap: () => ({ message: 'groupRequired' }) }),
  budget: budgetSchema,
  preferredSubjects: z.array(z.string()).default([]),
  preferredCities: z.array(z.string()).default([]),
  needsHostel: z.boolean().default(false),
})
