// src/components/sites/BestMonths.tsx — Vanessa Tourisme
import { MONTH_LABELS_LONG } from '@/config/constants'
import { cn } from '@/lib/cn'
import { formatMonths } from '@/lib/format'

interface BestMonthsProps {
  /** Mois recommandés (1 à 12) */
  months: number[]
  note?: string | null
  className?: string
}

/** Bandeau des 12 mois avec les meilleurs mois mis en valeur. */
export function BestMonths({ months, note, className }: BestMonthsProps) {
  return (
    <div className={className}>
      <ol className="grid grid-cols-12 gap-1" aria-label="Meilleurs mois pour visiter">
        {MONTH_LABELS_LONG.map((label, index) => {
          const best = months.includes(index + 1)
          return (
            <li
              key={label}
              title={label}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-xs font-semibold uppercase',
                best ? 'bg-primary-600 text-white' : 'bg-sable-100 text-sable-400',
              )}
            >
              <span aria-hidden="true">{label.charAt(0)}</span>
              <span className="sr-only">
                {label}
                {best ? ' : recommandé' : ''}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="mt-2 text-sm text-sable-600">
        {months.length > 0 ? (
          <>
            Idéal : <span className="font-semibold text-sable-800">{formatMonths(months)}</span>
          </>
        ) : (
          'Visitable toute l’année.'
        )}
        {note ? ` ${note}` : ''}
      </p>
    </div>
  )
}