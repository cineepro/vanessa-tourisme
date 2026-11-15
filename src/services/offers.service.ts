import { COLLECTIONS } from '@/config/appwrite-ids'
import { fromDateKey } from '@/lib/format'
import { getDocument, listDocuments, Query } from '@/lib/appwrite'
import type { Availability, Guide, ListResult, Offer, OfferDetail, Site } from '@/types'
import { getGuideById, getGuidesByIds } from './guides.service'
import { getSiteById } from './sites.service'

export interface OfferFilters {
  siteId?: string
  guideId?: string
  agencyId?: string
  maxPrice?: number
  limit?: number
  offset?: number
}

export function listOffers(filters: OfferFilters = {}): Promise<ListResult<Offer>> {
  const queries: string[] = [Query.equal('isActive', true)]

  if (filters.siteId) queries.push(Query.equal('siteId', filters.siteId))
  if (filters.guideId) queries.push(Query.equal('guideId', filters.guideId))
  if (filters.agencyId) queries.push(Query.equal('agencyId', filters.agencyId))
  if (filters.maxPrice != null) queries.push(Query.lessThanEqual('price', filters.maxPrice))

  queries.push(Query.orderAsc('sortOrder'))
  queries.push(Query.orderAsc('price'))
  queries.push(Query.limit(filters.limit ?? 50))
  queries.push(Query.offset(filters.offset ?? 0))

  return listDocuments<Offer>(COLLECTIONS.offers, queries)
}

/** Offre avec son site et son guide (page de reservation). */
export async function getOfferDetail(id: string): Promise<OfferDetail> {
  const offer = await getDocument<Offer>(COLLECTIONS.offers, id)

  const [site, guide] = await Promise.all([
    getSiteById(offer.siteId).catch((): undefined => undefined),
    offer.guideId ? getGuideById(offer.guideId).catch((): undefined => undefined) : undefined,
  ])

  return { ...offer, site: site as Site | undefined, guide: guide as Guide | undefined }
}

/** Offres d'un site, chacune avec son guide (fiche site : prestations et tarifs). */
export async function listSiteOffersWithGuides(siteId: string): Promise<OfferDetail[]> {
  const { documents: offers } = await listOffers({ siteId })
  const guideIds = offers.map((o) => o.guideId).filter((id): id is string => Boolean(id))
  const guides = await getGuidesByIds(guideIds)
  const byId = new Map(guides.map((guide) => [guide.$id, guide]))

  return offers.map((offer) => ({
    ...offer,
    guide: offer.guideId ? byId.get(offer.guideId) : undefined,
  }))
}

/** Prix le plus bas parmi des offres (affichage "a partir de"). */
export function getMinPrice(offers: Offer[]): number | null {
  if (offers.length === 0) return null
  return Math.min(...offers.map((offer) => offer.price))
}

/* ------------------------------------------------------------
   Disponibilites (offres en mode "slots")
------------------------------------------------------------ */
export async function listAvailabilities(
  offerId: string,
  fromKey: string,
  toKey: string,
): Promise<Availability[]> {
  const { documents } = await listDocuments<Availability>(COLLECTIONS.availabilities, [
    Query.equal('offerId', offerId),
    Query.greaterThanEqual('dateKey', fromKey),
    Query.lessThanEqual('dateKey', toKey),
    Query.notEqual('status', 'closed'),
    Query.orderAsc('dateKey'),
    Query.orderAsc('startTime'),
    Query.limit(200),
  ])
  return documents
}

export interface BookableCheck {
  bookable: boolean
  reason?: string
}

/**
 * Verification cote interface (la Function `tour-create-booking` refait
 * toujours ces controles cote serveur).
 */
export function checkDateBookable(
  offer: Offer,
  dateKey: string,
  slots: Availability[] = [],
  now: Date = new Date(),
): BookableCheck {
  const day = fromDateKey(dateKey)

  if (offer.closedWeekdays.includes(day.getDay())) {
    return { bookable: false, reason: 'Ce jour-là, le site n’est pas disponible.' }
  }

  const endOfDay = new Date(day)
  endOfDay.setHours(23, 59, 59, 999)
  const earliest = now.getTime() + offer.leadTimeHours * 3_600_000
  if (endOfDay.getTime() < earliest) {
    return {
      bookable: false,
      reason: `Réservation possible au moins ${offer.leadTimeHours} h à l’avance.`,
    }
  }

  if (offer.bookingMode === 'slots') {
    const open = slots.some(
      (slot) => slot.dateKey === dateKey && slot.status === 'open' && slot.booked < slot.capacity,
    )
    if (!open) return { bookable: false, reason: 'Aucun créneau disponible à cette date.' }
  }

  return { bookable: true }
}

/** Creneaux encore reservables pour une date. */
export function getOpenSlots(slots: Availability[], dateKey: string): Availability[] {
  return slots.filter(
    (slot) => slot.dateKey === dateKey && slot.status === 'open' && slot.booked < slot.capacity,
  )
}

/* ------------------------------------------------------------
   Prix
------------------------------------------------------------ */
export interface PriceBreakdown {
  unitPrice: number
  childUnitPrice: number
  total: number
}

/** Apercu du prix (le montant officiel est calcule par la Function). */
export function computeBookingTotal(
  offer: Offer,
  adults: number,
  children = 0,
  priceOverride: number | null = null,
): PriceBreakdown {
  const base = priceOverride ?? offer.price

  if (offer.pricingType === 'per_group') {
    return { unitPrice: base, childUnitPrice: 0, total: base }
  }

  const childUnitPrice = offer.childPrice ?? base
  return {
    unitPrice: base,
    childUnitPrice,
    total: adults * base + children * childUnitPrice,
  }
}

/** Montant de l'acompte, si l'offre en demande un. */
export function getDepositAmount(offer: Offer, total: number): number {
  if (offer.paymentMode !== 'deposit' || !offer.depositPercent) return 0
  return Math.round((total * offer.depositPercent) / 100)
}

export function validateParticipants(
  offer: Offer,
  adults: number,
  children = 0,
): BookableCheck {
  const people = adults + children
  if (adults < 1) return { bookable: false, reason: 'Au moins un adulte est nécessaire.' }
  if (people < offer.minParticipants) {
    return { bookable: false, reason: `Minimum ${offer.minParticipants} participant(s).` }
  }
  if (people > offer.maxParticipants) {
    return { bookable: false, reason: `Maximum ${offer.maxParticipants} participants.` }
  }
  return { bookable: true }
}