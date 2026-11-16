// src/components/ui/Spinner.tsx — Vanessa Tourisme
import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/cn'

export function Spinner({ className, label = 'Chargement' }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center">
      <LoaderCircle className={cn('h-5 w-5 animate-spin text-primary-600', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Chargement d'une page entière (routes protégées, pages chargées à la demande). */
export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}