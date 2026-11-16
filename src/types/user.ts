// src/types/user.ts — Vanessa Tourisme
import type { BaseDoc, Language } from './index'

/** Role applicatif deduit des labels / teams du compte. */
export type UserRole = 'tourist' | 'agency_staff' | 'superadmin'

/** Utilisateur connecte (derive du compte Appwrite). */
export interface SessionUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  /** Labels Appwrite (ex: "superadmin") */
  labels: string[]
  prefs: Record<string, unknown>
  createdAt: string
}

/**
 * Document de la collection `users` PARTAGEE avec Vanessa.
 * Les attributs exacts dependent de Vanessa : on ne declare que le minimum.
 * Ne jamais ajouter d'attribut tourisme ici (voir TouristProfile).
 */
export interface UserDoc extends BaseDoc {
  userId?: string
  name?: string | null
  email?: string | null
  phone?: string | null
  isBanned?: boolean
  isModerator?: boolean
  [key: string]: unknown
}

export type TravelStyle = 'solo' | 'couple' | 'family' | 'friends' | 'business'
export type BudgetProfile = 'low' | 'medium' | 'high' | 'luxury'

/** Collection `tour_profiles` : extension du compte pour le tourisme. */
export interface TouristProfile extends BaseDoc {
  userId: string
  nationality: string | null
  countryOfResidence: string | null
  phone: string | null
  preferredLanguage: Language
  interests: string[]
  travelStyle: TravelStyle | null
  budgetLevel: BudgetProfile | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  /** Sensible : visible uniquement par son proprietaire */
  healthNotes: string | null
  shareLocation: boolean
  lastLat: number | null
  lastLng: number | null
  lastLocationAt: string | null
  stayCity: string | null
  stayStart: string | null
  stayEnd: string | null
  onboardingDone: boolean
}

export type TouristProfileInput = Partial<
  Omit<TouristProfile, keyof BaseDoc | 'userId'>
>