import type { BaseDoc, Department } from './index'

export type PlaceType =
  | 'hospital'
  | 'clinic'
  | 'pharmacy'
  | 'restaurant'
  | 'maquis'
  | 'street_food'
  | 'cinema'
  | 'bar_club'
  | 'hotel'
  | 'market'
  | 'supermarket'
  | 'atm'
  | 'bank'
  | 'police'
  | 'embassy'
  | 'transport'
  | 'fuel'
  | 'leisure'

export type PlaceGroup = 'sante' | 'restauration' | 'loisirs' | 'services' | 'hebergement'
export type PlacePriceLevel = 'low' | 'medium' | 'high'
export type PlaceSource = 'manual' | 'osm' | 'partner'

/** Collection `tour_places` */
export interface Place extends BaseDoc {
  type: PlaceType
  name: string
  description: string | null
  department: Department | null
  city: string
  address: string | null
  latitude: number
  longitude: number
  geohash: string
  phone: string | null
  whatsapp: string | null
  website: string | null
  openingHours: string | null
  open24h: boolean
  hasEmergency: boolean
  priceLevel: PlacePriceLevel | null
  cuisine: string[]
  specialDishes: string[]
  acceptsCards: boolean
  source: PlaceSource
  externalId: string | null
  verifiedAt: string | null
  isActive: boolean
}

export interface PlaceWithDistance extends Place {
  distanceKm: number
}

export interface NearbyPlacesQuery {
  lat: number
  lng: number
  radiusKm?: number
  types?: PlaceType[]
  openNow?: boolean
  limit?: number
}