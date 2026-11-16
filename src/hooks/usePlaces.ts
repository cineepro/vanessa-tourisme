import type { LatLng, PlaceType } from '@/types'
import { getEmergencyPlaces, getNearbyPlaces } from '@/services/places.service'
import { useAsync } from './useAsync'

interface NearbyOptions {
  types?: PlaceType[]
  radiusKm?: number
  limit?: number
  emergencyOnly?: boolean
}

/** Lieux utiles autour d'une position (inactif tant que position est null). */
export function useNearbyPlaces(position: LatLng | null, options: NearbyOptions = {}) {
  const typesKey = options.types?.join(',') ?? ''

  return useAsync(
    () =>
      getNearbyPlaces({
        lat: (position as LatLng).lat,
        lng: (position as LatLng).lng,
        ...options,
      }),
    [
      position ? position.lat.toFixed(3) : null,
      position ? position.lng.toFixed(3) : null,
      typesKey,
      options.radiusKm,
      options.limit,
      options.emergencyOnly,
    ],
    { enabled: Boolean(position) },
  )
}

export function useEmergencyPlaces(position: LatLng | null) {
  return useAsync(
    () => getEmergencyPlaces(position as LatLng),
    [position ? position.lat.toFixed(3) : null, position ? position.lng.toFixed(3) : null],
    { enabled: Boolean(position) },
  )
}