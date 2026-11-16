// src/components/ui/Textarea.tsx — Vanessa Tourisme
import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string | null
  hint?: string
  /** Affiche "n / maxLength" (nécessite maxLength) */
  showCounter?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, showCounter, className, id, value, maxLength, rows = 4, ...props },
  ref,
) {
  const autoId = useId()
  const textareaId = id ?? autoId
  const length = typeof value === 'string' ? value.length : 0

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-sable-800">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full resize-y rounded-2xl border bg-white px-4 py-3 text-base text-sable-900 placeholder:text-sable-400',
          'transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20',
          error ? 'border-danger-500' : 'border-sable-300',
          className,
        )}
        {...props}
      />

      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="text-sm">
          {error ? (
            <p className="text-danger-700">{error}</p>
          ) : hint ? (
            <p className="text-xs text-sable-500">{hint}</p>
          ) : null}
        </div>
        {showCounter && maxLength && (
          <p className="shrink-0 text-xs text-sable-500">
            {length} / {maxLength}
          </p>
        )}
      </div>
    </div>
  )
})