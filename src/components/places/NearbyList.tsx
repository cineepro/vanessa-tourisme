// src/components/places/NearbyList.tsx — Vanessa Tourisme
import { useMemo, useState } from 'react'
import { LocateFixed, MapPinOff } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PLACE_GROUP_LABELS, PLACE_TYPE_META } from '@/config/constants'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useNearbyPlaces } from '@/hooks/usePlaces'
import { cn } from '@/lib/cn'
import type { PlaceGroup, PlaceType } from '@/types'
import { PlaceCard } from './PlaceCard'

interface NearbyListProps {
  initialGroup?: PlaceGroup | 'all'
  radiusKm?: number
  limit?: number
  className?: string
}

const GROUPS: PlaceGroup[] = ['sante', 'restauration', 'loisirs', 'services']

/** Lieux utiles près de la position du touriste (santé, manger, sortir, services). */
export function NearbyList({ initialGroup = 'all', radiusKm = 5, limit = 20, className }: NearbyListProps) {
  const [group, setGroup] = useState<PlaceGroup | 'all'>(initialGroup)
  const { position, status, error: geoError, isLoading: locating, request } = useGeolocation({
    autoRequest: true,
  })

  const types = useMemo<PlaceType[] | undefined>(() => {
    if (group === 'all') return undefined
    return (Object.entries(PLACE_TYPE_META) as [PlaceType, { group: PlaceGroup }][])
      .filter(([, meta]) => meta.group === group)
      .map(([type]) => type)
  }, [group])

  const { data: places, isLoading, error, reload } = useNearbyPlaces(position, {
    types,
    radiusKm,
    limit,
  })

  return (
    <section className={cn('space-y-4', className)} aria-label="Lieux près de vous">
      <div className="flex flex-wrap gap-2">
        {(['all', ...GROUPS] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setGroup(item)}
            aria-pressed={group === item}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              group === item
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-sable-300 bg-white text-sable-700 hover:bg-sable-100',
            )}
          >
            {item === 'all' ? 'Tout' : PLACE_GROUP_LABELS[item]}
          </button>
        ))}
      </div>

      {!position ? (
        <div className="rounded-3xl border border-sable-200 bg-white p-6 text-center">
          <LocateFixed className="mx-auto h-8 w-8 text-primary-600" aria-hidden="true" />
          <h3 className="mt-3 font-display text-lg font-bold text-sable-900">
            Trouvons ce qu’il y a autour de vous
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-sable-600">
            Autorisez la géolocalisation pour voir les lieux les plus proches. Votre position reste sur
            votre appareil.
          </p>
          {geoError && <p className="mt-3 text-sm text-danger-700">{geoError}</p>}
          <Button
            className="mt-4"
            onClick={() => void request()}
            isLoading={locating}
            disabled={status === 'unavailable'}
          >
            Utiliser ma position
          </Button>
        </div>
      ) : isLoading && !places ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<MapPinOff className="h-6 w-6" aria-hidden="true" />}
          title="Impossible de charger les lieux"
          description={error}
          action={
            <Button variant="outline" onClick={reload}>
              Réessayer
            </Button>
          }
        />
      ) : !places || places.length === 0 ? (
        <EmptyState
          icon={<MapPinOff className="h-6 w-6" aria-hidden="true" />}
          title="Rien trouvé à proximité"
          description="Nous n’avons pas encore de lieux référencés autour de vous. Demandez à Vanessa, elle connaît peut-être une adresse."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {places.map((place) => (
            <PlaceCard key={place.$id} place={place} />
          ))}
        </div>
      )}
    </section>
  )
}