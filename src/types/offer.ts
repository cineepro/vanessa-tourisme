import type { BaseDoc, Currency, SpokenLanguage } from './index'
import type { Guide } from './guide'
import type { Site } from './site'

export type PricingType = 'per_person' | 'per_group'
export type BookingMode = 'any_date' | 'slots'
export type PaymentMode = 'on_site' | 'deposit' | 'online'
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict'
export type AvailabilityStatus = 'open' | 'full' | 'closed'

/** Collection `tour_offers` : une prestation (site + guide + tarif). */
export interface Offer extends BaseDoc {
  agencyId: string
  siteId: string
  guideId: string | null
  title: string
  description: string | null
  pricingType: PricingType
  /** En unites entieres de la devise (XOF sans centimes) */
  price: number
  childPrice: number | null
  childMaxAge: number
  currency: Currency
  durationMinutes: number | null
  minParticipants: number
  maxParticipants: number
  languages: SpokenLanguage[]
  includes: string[]
  excludes: string[]
  meetingPoint: string | null
  meetingLat: number | null
  meetingLng: number | null
  bookingMode: BookingMode
  /** Delai minimum avant la visite */
  leadTimeHours: number
  /** Jours fermes : 0 = dimanche ... 6 = samedi */
  closedWeekdays: number[]
  paymentMode: PaymentMode
  depositPercent: number | null
  instantConfirm: boolean
  cancellationPolicy: CancellationPolicy
  cancellationHours: number
  coverId: string | null
  sortOrder: number
  isActive: boolean
}

/** Offre enrichie de son site et de son guide pour l'affichage. */
export interface OfferDetail extends Offer {
  site?: Site
  guide?: Guide
}

/** Collection `tour_availabilities` (si bookingMode = "slots") */
export interface Availability extends BaseDoc {
  offerId: string
  agencyId: string
  /** "YYYY-MM-DD" */
  dateKey: string
  /** "HH:mm" */
  startTime: string
  capacity: number
  booked: number
  priceOverride: number | null
  status: AvailabilityStatus
}