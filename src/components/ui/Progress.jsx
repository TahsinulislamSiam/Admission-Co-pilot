import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

/** Indeterminate progress bar with optional label (extraction pipeline etc). */
export function Progress({ value = 0, className }) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-200', className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 rounded-full bg-brand-600 transition-transform duration-500"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
