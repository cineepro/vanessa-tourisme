// src/components/places/PlaceCard.tsx — Vanessa Tourisme
import { Clock, Navigation, Phone, ShieldPlus } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { PLACE_TYPE_META } from '@/config/constants'
import { cn } from '@/lib/cn'
import { formatDistance, telUrl } from '@/lib/format'
import { directionsUrl } from '@/lib/geo'
import type { Place, PlaceWithDistance } from '@/types'
import { GROUP_COLORS, PlaceIcon } from './PlaceIcon'

interface PlaceCardProps {
  place: Place | PlaceWithDistance
  /** Version réduite (suggestions dans le chat) */
  compact?: boolean
  className?: string
}

const PRICE_SYMBOLS = { low: '€', medium: '€€', high: '€€€' } as const

export function PlaceCard({ place, compact = false, className }: PlaceCardProps) {
  const meta = PLACE_TYPE_META[place.type]
  const distance = 'distanceKm' in place ? place.distanceKm : null

  return (
    <article
      className={cn(
        'flex gap-3 rounded-2xl border border-sable-200 bg-white p-3.5 shadow-card',
        compact && 'p-3',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          GROUP_COLORS[meta.group],
        )}
      >
        <PlaceIcon type={place.type} className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-sable-900">{place.name}</h3>
          {distance !== null && (
            <span className="shrink-0 text-xs font-semibold text-primary-700">
              {formatDistance(distance)}
            </span>
          )}
        </div>

        <p className="text-xs text-sable-500">
          {meta.label} · {place.city}
        </p>

        {!compact && place.address && <p className="mt-1 text-xs text-sable-600">{place.address}</p>}
        {!compact && place.description && (
          <p className="mt-1 line-clamp-2 text-xs text-sable-600">{place.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {place.open24h && (
            <Badge tone="primary" icon={<Clock className="h-3 w-3" aria-hidden="true" />}>
              24 h/24
            </Badge>
          )}
          {place.hasEmergency && (
            <Badge tone="danger" icon={<ShieldPlus className="h-3 w-3" aria-hidden="true" />}>
              Urgences
            </Badge>
          )}
          {place.priceLevel && <Badge tone="neutral">{PRICE_SYMBOLS[place.priceLevel]}</Badge>}
          {!compact && place.specialDishes.slice(0, 2).map((dish) => (
            <Badge key={dish} tone="accent">
              {dish}
            </Badge>
          ))}
        </div>

        {!compact && place.openingHours && (
          <p className="mt-1.5 text-xs text-sable-500">{place.openingHours}</p>
        )}

        <div className="mt-2.5 flex flex-wrap gap-2">
          <a
            href={directionsUrl({ lat: place.latitude, lng: place.longitude })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
            Itinéraire
          </a>
          {place.phone && (
            <a
              href={telUrl(place.phone)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sable-300 px-3 py-1.5 text-xs font-semibold text-sable-700 hover:bg-sable-100"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              Appeler
            </a>
          )}
        </div>
      </div>
    </article>
  )
}