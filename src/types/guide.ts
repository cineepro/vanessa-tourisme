import type { BaseDoc, SpokenLanguage } from './index'

export type GuideStatus = 'pending' | 'active' | 'inactive'

/** Collection `tour_guides` */
export interface Guide extends BaseDoc {
  agencyId: string
  /** Si le guide possede un compte */
  userId: string | null
  fullName: string
  slug: string
  bio: string | null
  photoId: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  languages: SpokenLanguage[]
  specialties: string[]
  /** Sites couverts */
  siteIds: string[]
  yearsExperience: number | null
  certified: boolean
  licenseNumber: string | null
  baseCity: string | null
  ratingAvg: number
  ratingCount: number
  status: GuideStatus
}

export interface GuideFilters {
  q?: string
  siteId?: string
  language?: SpokenLanguage
  certified?: boolean
  agencyId?: string
  limit?: number
  offset?: number
}