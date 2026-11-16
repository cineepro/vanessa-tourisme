// src/components/ui/Skeleton.tsx — Vanessa Tourisme
import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}