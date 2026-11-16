// src/components/places/EmergencyBar.tsx — Vanessa Tourisme
import { useState } from 'react'
import { Hospital, Phone } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EMERGENCY_NUMBERS } from '@/config/constants'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useEmergencyPlaces } from '@/hooks/usePlaces'
import { cn } from '@/lib/cn'
import { PlaceCard } from './PlaceCard'

/** Numéros d'urgence du Bénin et accès rapide aux urgences médicales les plus proches. */
export function EmergencyBar({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const { position, error: geoError, isLoading: locating, request } = useGeolocation()
  const { data: places, isLoading, error } = useEmergencyPlaces(open ? position : null)

  const findHospital = async () => {
    setOpen(true)
    if (!position) await request()
  }

  return (
    <section
      aria-label="Urgences"
      className={cn('rounded-3xl border border-danger-200 bg-danger-50 p-4 sm:p-5', className)}
    >
      <h2 className="font-display text-base font-bold text-danger-800">En cas d’urgence</h2>

      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {EMERGENCY_NUMBERS.map((item) => (
          <li key={item.number}>
            <a
              href={`tel:${item.number}`}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm hover:bg-danger-100"
            >
              <Phone className="h-5 w-5 shrink-0 text-danger-600" aria-hidden="true" />
              <span>
                <span className="block font-display text-xl font-bold text-danger-700">{item.number}</span>
                <span className="block text-xs text-sable-600">{item.label}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <Button
        variant="danger"
        size="sm"
        className="mt-4"
        onClick={findHospital}
        isLoading={locating}
        leftIcon={<Hospital className="h-4 w-4" aria-hidden="true" />}
      >
        Urgences médicales les plus proches
      </Button>

      {open && (
        <div className="mt-4 space-y-3">
          {geoError && <p className="text-sm text-danger-700">{geoError}</p>}
          {isLoading && <Spinner />}
          {error && <p className="text-sm text-danger-700">{error}</p>}
          {places && places.length === 0 && (
            <p className="text-sm text-sable-700">
              Aucun établissement référencé près de vous. Appelez le 112.
            </p>
          )}
          {places?.slice(0, 3).map((place) => <PlaceCard key={place.$id} place={place} compact />)}
        </div>
      )}
    </section>
  )
}