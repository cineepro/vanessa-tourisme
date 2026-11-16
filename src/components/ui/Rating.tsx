// src/components/ui/Rating.tsx — Vanessa Tourisme
import { useState } from 'react'
import { Star } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatRating } from '@/lib/format'

interface RatingProps {
  /** Note de 0 à 5 */
  value: number
  /** Nombre d'avis (affiché entre parenthèses) */
  count?: number
  size?: 'sm' | 'md' | 'lg'
  /** Rend les étoiles cliquables */
  onChange?: (value: number) => void
  /** Affiche la note chiffrée (ex: 4,5) */
  showValue?: boolean
  className?: string
}

const starSizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-7 w-7' } as const

export function Rating({
  value,
  count,
  size = 'md',
  onChange,
  showValue = true,
  className,
}: RatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const interactive = Boolean(onChange)
  const shown = hover ?? Math.round(value)

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div
        className="flex items-center"
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={interactive ? 'Votre note' : `Note : ${formatRating(value)} sur 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= shown
          const icon = (
            <Star
              className={cn(
                starSizes[size],
                filled ? 'fill-accent-400 text-accent-500' : 'fill-transparent text-sable-300',
              )}
              aria-hidden="true"
            />
          )

          if (!interactive) return <span key={star}>{icon}</span>

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={Math.round(value) === star}
              aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
              className="rounded p-0.5"
            >
              {icon}
            </button>
          )
        })}
      </div>

      {!interactive && showValue && value > 0 && (
        <span className="text-sm font-semibold text-sable-800">{formatRating(value)}</span>
      )}
      {!interactive && count !== undefined && (
        <span className="text-sm text-sable-500">({count})</span>
      )}
    </div>
  )
}