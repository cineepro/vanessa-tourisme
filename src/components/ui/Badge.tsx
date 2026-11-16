// src/components/ui/Badge.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'primary' | 'accent' | 'danger' | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-sable-100 text-sable-700',
  primary: 'bg-primary-100 text-primary-800',
  accent: 'bg-accent-100 text-accent-800',
  danger: 'bg-danger-100 text-danger-800',
  info: 'bg-sky-100 text-sky-800',
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
  icon?: ReactNode
}

export function Badge({ children, tone = 'neutral', className, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}