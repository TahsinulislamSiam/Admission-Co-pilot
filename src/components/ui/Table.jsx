import { cn } from '@/lib/utils'

/** Lightweight styled table. Pass rows as <tr> children. */
export function Table({ className, children }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className={cn('w-full min-w-[640px] text-left text-sm', className)}>{children}</table>
    </div>
  )
}

export function THead({ children }) {
  return (
    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
      {children}
    </thead>
  )
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>
}

export function TR({ className, children, ...props }) {
  return (
    <tr className={cn('transition-colors hover:bg-brand-50/40', className)} {...props}>
      {children}
    </tr>
  )
}

export function TH({ className, children, ...props }) {
  return (
    <th className={cn('px-4 py-3 font-semibold', className)} {...props}>
      {children}
    </th>
  )
}

export function TD({ className, children, ...props }) {
  return (
    <td className={cn('px-4 py-3 align-middle text-slate-700', className)} {...props}>
      {children}
    </td>
  )
}
