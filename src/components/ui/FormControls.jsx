import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-slate-300',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  )
}

export function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-300 bg-white',
        'data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export function RadioGroup({ className, ...props }) {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} />
}

export function Radio({ className, value, ...props }) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white',
        'data-[state=checked]:border-brand-600',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="h-2.5 w-2.5 rounded-full bg-brand-600" />
    </RadioGroupPrimitive.Item>
  )
}

/** Labelled checkbox row used across filters and forms. */
export function CheckboxRow({ label, id, ...props }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <Checkbox id={id} {...props} />
      <span>{label}</span>
    </label>
  )
}
