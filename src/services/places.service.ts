import { COLLECTIONS } from '@/config/appwrite-ids'
import { DEFAULT_NEARBY_RADIUS_KM } from '@/config/constants'
import { geohashQuery, getDocument, listDocuments, Query } from '@/lib/appwrite'
import { geohashPrefixesForRadius, sortByDistance } from '@/lib/geo'
import type { LatLng, ListResult, NearbyPlacesQuery, Place, PlaceType, PlaceWithDistance } from '@/types'

const MAX_FETCH = 100

/**
 * Lieux utiles autour d'une position (sante, restauration, loisirs...).
 * Si peu de resultats, le rayon est elargi (x2 puis x4).
 */
export async function getNearbyPlaces(query: NearbyPlacesQuery): Promise<PlaceWithDistance[]> {
  const {
    lat,
    lng,
    radiusKm = DEFAULT_NEARBY_RADIUS_KM,
    types,
    emergencyOnly,
    limit = 20,
  } = query

  const origin: LatLng = { lat, lng }
  const radii = [radiusKm, radiusKm * 2, radiusKm * 4]

  for (const radius of radii) {
    const { prefixes } = geohashPrefixesForRadius(origin, radius)

    const queries: string[] = [
      Query.equal('isActive', true),
      geohashQuery(prefixes),
      Query.limit(MAX_FETCH),
    ]
    if (types?.length) queries.push(Query.equal('type', types))
    if (emergencyOnly) queries.push(Query.equal('hasEmergency', true))

    const { documents } = await listDocuments<Place>(COLLECTIONS.places, queries)
    const within = sortByDistance(documents, origin).filter((place) => place.distanceKm <= radius)

    const isLastTry = radius === radii[radii.length - 1]
    if (within.length >= Math.min(limit, 3) || isLastTry) return within.slice(0, limit)
  }

  return []
}

/** Pharmacies, cliniques et hopitaux avec urgences les plus proches. */
export function getEmergencyPlaces(position: LatLng, limit = 10): Promise<PlaceWithDistance[]> {
  return getNearbyPlaces({
    ...position,
    types: ['hospital', 'clinic'],
    emergencyOnly: true,
    radiusKm: 10,
    limit,
  })
}

export interface PlaceFilters {
  type?: PlaceType
  city?: string
  q?: string
  limit?: number
  offset?: number
}

export function listPlaces(filters: PlaceFilters = {}): Promise<ListResult<Place>> {
  const queries: string[] = [Query.equal('isActive', true)]

  if (filters.type) queries.push(Query.equal('type', filters.type))
  if (filters.city) queries.push(Query.equal('city', filters.city))
  const term = filters.q?.trim()
  if (term) queries.push(Query.search('name', term))

  queries.push(Query.orderAsc('name'))
  queries.push(Query.limit(filters.limit ?? 30))
  queries.push(Query.offset(filters.offset ?? 0))
  return listDocuments<Place>(COLLECTIONS.places, queries)
}

export function getPlaceById(id: string): Promise<Place> {
  return getDocument<Place>(COLLECTIONS.places, id)
}

/** Garde l'ordre des IDs (lieux suggeres par Vanessa dans le chat). */
export async function getPlacesByIds(ids: string[]): Promise<Place[]> {
  const unique = [...new Set(ids)].slice(0, 100)
  if (unique.length === 0) return []

  const { documents } = await listDocuments<Place>(COLLECTIONS.places, [
    Query.equal('$id', unique),
    Query.limit(unique.length),
  ])
  const byId = new Map(documents.map((place) => [place.$id, place]))
  return unique.map((id) => byId.get(id)).filter((place): place is Place => Boolean(place))
}