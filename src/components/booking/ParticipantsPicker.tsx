// src/components/booking/ParticipantsPicker.tsx — Vanessa Tourisme
import { Minus, Plus } from 'lucide-react'

import { PRICING_TYPE_LABELS } from '@/config/constants'
import { formatPrice } from '@/lib/format'
import type { Offer } from '@/types'

interface ParticipantsPickerProps {
  offer: Offer
  adults: number
  childCount: number
  onChange: (value: { adults: number; children: number }) => void
}

export function ParticipantsPicker({ offer, adults, childCount, onChange }: ParticipantsPickerProps) {
  const total = adults + childCount
  const atMax = total >= offer.maxParticipants
  const hasChildPrice = offer.pricingType === 'per_person'

  return (
    <div className="space-y-3 rounded-3xl border border-sable-200 bg-white p-4">
      <Row
        title="Adultes"
        subtitle={`${formatPrice(offer.price, offer.currency)} ${PRICING_TYPE_LABELS[offer.pricingType]}`}
        value={adults}
        canDecrease={adults > 1}
        canIncrease={!atMax}
        onDecrease={() => onChange({ adults: adults - 1, children: childCount })}
        onIncrease={() => onChange({ adults: adults + 1, children: childCount })}
      />

      {hasChildPrice && (
        <Row
          title="Enfants"
          subtitle={`Jusqu’à ${offer.childMaxAge} ans · ${formatPrice(offer.childPrice ?? offer.price, offer.currency, { free: true })}`}
          value={childCount}
          canDecrease={childCount > 0}
          canIncrease={!atMax}
          onDecrease={() => onChange({ adults, children: childCount - 1 })}
          onIncrease={() => onChange({ adults, children: childCount + 1 })}
        />
      )}

      <p className="text-xs text-sable-500">
        {offer.minParticipants > 1 ? `Minimum ${offer.minParticipants} personnes. ` : ''}
        Maximum {offer.maxParticipants} personnes.
        {offer.pricingType === 'per_group' ? ' Le tarif est valable pour tout le groupe.' : ''}
      </p>
    </div>
  )
}

interface RowProps {
  title: string
  subtitle: string
  value: number
  canDecrease: boolean
  canIncrease: boolean
  onDecrease: () => void
  onIncrease: () => void
}

function Row({ title, subtitle, value, canDecrease, canIncrease, onDecrease, onIncrease }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-semibold text-sable-900">{title}</p>
        <p className="text-xs text-sable-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrease}
          disabled={!canDecrease}
          aria-label={`Retirer un ${title.toLowerCase()}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sable-300 text-sable-700 hover:bg-sable-100 disabled:opacity-30"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="w-6 text-center font-display text-lg font-bold" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={!canIncrease}
          aria-label={`Ajouter un ${title.toLowerCase()}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sable-300 text-sable-700 hover:bg-sable-100 disabled:opacity-30"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}