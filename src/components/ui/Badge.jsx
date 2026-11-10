import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700',
        brand: 'bg-brand-100 text-brand-800',
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        danger: 'bg-rose-100 text-rose-800',
        info: 'bg-sky-100 text-sky-800',
        purple: 'bg-purple-100 text-purple-800',
        outline: 'border border-slate-300 text-slate-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

/** Small status/label pill. */
export function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}
