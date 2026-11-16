// src/components/ui/Pagination.tsx — Vanessa Tourisme
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/cn'

interface PaginationProps {
  /** Page courante (commence à 1) */
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
  className?: string
}

/** Pagination simple : précédent, numéros proches, suivant. */
export function Pagination({ page, total, pageSize, onChange, className }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1) return null

  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1])
  const visible = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)

  const items: (number | 'gap')[] = []
  visible.forEach((p, index) => {
    if (index > 0 && p - visible[index - 1] > 1) items.push('gap')
    items.push(p)
  })

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Page précédente"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-sable-300 bg-white text-sable-700 hover:bg-sable-100 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {items.map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-sable-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition-colors',
              item === page
                ? 'bg-primary-600 text-white'
                : 'border border-sable-300 bg-white text-sable-700 hover:bg-sable-100',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Page suivante"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-sable-300 bg-white text-sable-700 hover:bg-sable-100 disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  )
}