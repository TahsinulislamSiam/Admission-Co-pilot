import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

/** Tab strip + trigger (Radix based). */
export const Tabs = TabsPrimitive.Root

export function TabsList({ className, children, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ className, value, children, ...props }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors',
        'hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

export function TabsContent({ className, value, children, ...props }) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn('mt-4 focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  )
}
