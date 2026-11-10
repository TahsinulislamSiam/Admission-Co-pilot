import { cn } from '@/lib/utils'

/** Loading placeholder block. */
export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />
}

/** Repeating skeleton list for cards. */
export function SkeletonList({ count = 3, className }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn('h-24 w-full', className)} />
      ))}
    </div>
  )
}
