/**
 * Types partages + re-export de tous les types du projet.
 * Import : import type { Site, Booking } from '@/types'
 *
 * Note : Appwrite renvoie `null` pour un attribut optionnel non renseigne,
 * d'ou les `string | null` dans les interfaces de documents.
 */

export interface BaseDoc {
  $id: string
  $createdAt: string
  $updatedAt: string
  $permissions: string[]
  $collectionId: string
  $databaseId: string
}

export interface ListResult<T> {
  total: number
  documents: T[]
}

export interface LatLng {
  lat: number
  lng: number
}

/** Format de reponse de toutes nos Appwrite Functions. */
export type FunctionResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

export type Department =
  | 'Alibori'
  | 'Atacora'
  | 'Atlantique'
  | 'Borgou'
  | 'Collines'
  | 'Couffo'
  | 'Donga'
  | 'Littoral'
  | 'Mono'
  | 'Ouémé'
  | 'Plateau'
  | 'Zou'

export type Currency = 'XOF' | 'EUR' | 'USD'

/** Langue de l'interface */
export type Language = 'fr' | 'en'

/** Langues parlees (guides, offres) */
export type SpokenLanguage =
  | 'fr'
  | 'en'
  | 'fon'
  | 'yoruba'
  | 'goun'
  | 'bariba'
  | 'dendi'
  | 'es'
  | 'pt'
  | 'de'

export type PublishStatus = 'draft' | 'published' | 'archived'

export type SortDirection = 'asc' | 'desc'

export * from './agency'
export * from './article'
export * from './booking'
export * from './chat'
export * from './favorite'
export * from './guide'
export * from './notification'
export * from './offer'
export * from './place'
export * from './review'
export * from './site'
export * from './user'