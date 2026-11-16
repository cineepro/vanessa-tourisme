// src/components/ui/EmptyState.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl border border-dashed border-sable-300 bg-white/60 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-sable-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-sable-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}