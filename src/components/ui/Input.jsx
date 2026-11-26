import { forwardRef, cloneElement, isValidElement, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import * as LabelPrimitive from '@radix-ui/react-label'

/** Text input with label + error (React Hook Form friendly). */
export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400',
      'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
      'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
      'file:mr-3 file:rounded file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-brand-700',
      className
    )}
    {...props}
  />
))
Input.displayName = 'Input'

/** Password input with a show/hide toggle. Takes the same props as Input. */
export const PasswordInput = forwardRef(({ className, ...props }, ref) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {visible ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
      </button>
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'

export const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400',
      'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
      className
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export const Label = ({ className, children, ...props }) => (
  <LabelPrimitive.Root
    className={cn('mb-1.5 block text-sm font-medium text-slate-700', className)}
    {...props}
  >
    {children}
  </LabelPrimitive.Root>
)

/** Small red error message under an input. */
export const FieldError = ({ children }) =>
  children ? <p className="mt-1 text-sm text-rose-600">{children}</p> : null

/** Wraps label + input + error + hint consistently.
 * The label is associated with the child control via a generated id so
 * screen readers (and getByLabelText) connect them. */
export const Field = ({ label, hint, error, children, className }) => {
  const generatedId = useId()
  const childId = isValidElement(children) ? children.props.id || generatedId : undefined
  return (
    <div className={cn('mb-4', className)}>
      {label && <Label htmlFor={childId}>{label}</Label>}
      {childId ? cloneElement(children, { id: childId }) : children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  )
}
