// src/components/ui/Input.tsx — Vanessa Tourisme
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string | null
  hint?: string
  leftIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-sable-800">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sable-500">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-12 w-full rounded-2xl border bg-white px-4 text-base text-sable-900 placeholder:text-sable-400',
            'transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20',
            'disabled:cursor-not-allowed disabled:bg-sable-100',
            leftIcon && 'pl-11',
            error ? 'border-danger-500' : 'border-sable-300',
            className,
          )}
          {...props}
        />
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-sable-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
})