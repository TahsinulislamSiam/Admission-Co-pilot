import { cn } from '@/lib/utils'

/** Card container + titled variants. */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200 bg-white shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return <div className={cn('border-b border-slate-100 px-5 py-4', className)}>{children}</div>
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('text-base font-semibold text-slate-800', className)}>{children}</h3>
}

export function CardContent({ className, children }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn('border-t border-slate-100 px-5 py-3 bg-slate-50/60', className)}>
      {children}
    </div>
  )
}
