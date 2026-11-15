import { BENIN_BOUNDS } from '@/config/constants'
import type { LatLng } from '@/types'

/* ------------------------------------------------------------
   Distance
------------------------------------------------------------ */
const EARTH_RADIUS_KM = 6371
const KM_PER_DEGREE = 111.32

const toRad = (deg: number): number => (deg * Math.PI) / 180

/** Distance en km entre deux points (formule de Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Ajoute `distanceKm` a chaque element puis trie du plus proche au plus loin. */
export function sortByDistance<T extends { latitude: number; longitude: number }>(
  items: T[],
  origin: LatLng,
): (T & { distanceKm: number })[] {
  return items
    .map((item) => ({
      ...item,
      distanceKm: haversineKm(origin, { lat: item.latitude, lng: item.longitude }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

/* ------------------------------------------------------------
   Validation
------------------------------------------------------------ */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

export function isInBenin(point: LatLng): boolean {
  return (
    point.lat >= BENIN_BOUNDS.south &&
    point.lat <= BENIN_BOUNDS.north &&
    point.lng >= BENIN_BOUNDS.west &&
    point.lng <= BENIN_BOUNDS.east
  )
}

/* ------------------------------------------------------------
   Geohash
   Sert a la recherche de proximite : on stocke `geohash` sur
   les sites et les lieux, puis on interroge par prefixe.
------------------------------------------------------------ */
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

export function encodeGeohash(lat: number, lng: number, precision = 9): string {
  const latRange: [number, number] = [-90, 90]
  const lngRange: [number, number] = [-180, 180]
  let hash = ''
  let bit = 0
  let chunk = 0
  let evenBit = true

  while (hash.length < precision) {
    const range = evenBit ? lngRange : latRange
    const value = evenBit ? lng : lat
    const mid = (range[0] + range[1]) / 2

    if (value >= mid) {
      chunk = (chunk << 1) | 1
      range[0] = mid
    } else {
      chunk = chunk << 1
      range[1] = mid
    }

    evenBit = !evenBit
    bit += 1

    if (bit === 5) {
      hash += BASE32[chunk]
      bit = 0
      chunk = 0
    }
  }

  return hash
}

function geohashCellSizeDeg(precision: number): { lat: number; lng: number } {
  const bits = precision * 5
  const lngBits = Math.ceil(bits / 2)
  const latBits = Math.floor(bits / 2)
  return { lat: 180 / 2 ** latBits, lng: 360 / 2 ** lngBits }
}

const wrapLng = (lng: number): number => ((((lng + 180) % 360) + 360) % 360) - 180
const clampLat = (lat: number): number => Math.max(-89.999999, Math.min(89.999999, lat))

/**
 * Renvoie les prefixes geohash (cellule centrale + 8 voisines) qui couvrent
 * un rayon donne autour d'un point.
 *
 * Utilisation :
 *   const { prefixes } = geohashPrefixesForRadius(position, 5)
 *   Query.or(prefixes.map((p) => Query.startsWith('geohash', p)))
 * puis affiner avec haversineKm / sortByDistance.
 */
export function geohashPrefixesForRadius(
  center: LatLng,
  radiusKm: number,
): { precision: number; prefixes: string[] } {
  const lngScale = Math.max(Math.cos(toRad(center.lat)), 0.01)

  // Precision la plus fine dont la cellule reste plus grande que le rayon
  let precision = 1
  for (let p = 9; p >= 1; p -= 1) {
    const cell = geohashCellSizeDeg(p)
    const latKm = cell.lat * KM_PER_DEGREE
    const lngKm = cell.lng * KM_PER_DEGREE * lngScale
    if (Math.min(latKm, lngKm) >= radiusKm) {
      precision = p
      break
    }
  }

  const cell = geohashCellSizeDeg(precision)
  const prefixes = new Set<string>()

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      prefixes.add(
        encodeGeohash(
          clampLat(center.lat + dy * cell.lat),
          wrapLng(center.lng + dx * cell.lng),
          precision,
        ),
      )
    }
  }

  return { precision, prefixes: [...prefixes] }
}

/* ------------------------------------------------------------
   Position de l'appareil
------------------------------------------------------------ */
export interface DevicePosition extends LatLng {
  accuracy: number
}

export function getCurrentPosition(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  },
): Promise<DevicePosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('GEOLOCATION_UNSUPPORTED'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      (error) => reject(error),
      options,
    )
  })
}

export function geolocationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'GEOLOCATION_UNSUPPORTED') {
    return 'Votre appareil ne permet pas la géolocalisation.'
  }

  const code = (error as { code?: number } | null)?.code
  switch (code) {
    case 1:
      return 'Vous avez refusé l’accès à votre position. Vous pouvez l’autoriser dans les réglages de votre navigateur.'
    case 2:
      return 'Votre position est introuvable pour le moment. Vérifiez votre connexion ou votre GPS.'
    case 3:
      return 'La recherche de votre position a pris trop de temps. Réessayez.'
    default:
      return 'Impossible de récupérer votre position.'
  }
}

/* ------------------------------------------------------------
   Liens externes
------------------------------------------------------------ */
/** Ouvre l'itineraire dans Google Maps (ou l'app de cartes du telephone). */
export function directionsUrl(destination: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`
}