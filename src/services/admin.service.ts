// src/services/admin.service.ts — Vanessa Tourisme
// Gestion du contenu par les agences (sites, guides, offres, créneaux, paramètres).
//
// IMPORTANT (permissions Appwrite) :
//  - Ces écritures se font depuis le navigateur, avec les droits de l'utilisateur.
//    Les collections tour_sites, tour_guides, tour_offers, tour_availabilities doivent
//    avoir la sécurité au niveau des documents ACTIVÉE, et la permission « create »
//    accordée au label `agency` (ainsi qu'à `superadmin`). Idem pour la permission
//    « create » des buckets de photos.
//  - Chaque document créé reçoit : lecture publique, modification par l'équipe de
//    l'agence, suppression par les propriétaires/admins de l'équipe et le superadmin.
import { BUCKETS, COLLECTIONS } from '@/config/appwrite-ids'
import {
  AppError,
  createDocument,
  deleteDocument,
  getDocument,
  ID,
  listDocuments,
  Permission,
  Query,
  Role,
  storage,
  updateDocument,
} from '@/lib/appwrite'
import { fromDateKey, isoToDateKey, slugify, toDateKey } from '@/lib/format'
import { encodeGeohash } from '@/lib/geo'
import type {
  Agency,
  Availability,
  BaseDoc,
  Booking,
  Guide,
  ListResult,
  Offer,
  PublishStatus,
  Site,
} from '@/types'
import { listAgencyBookings } from './bookings.service'
import { listAgencyReviews } from './reviews.service'
import { validateImageFile } from './storage.service'

/* ------------------------------------------------------------
   Permissions des documents créés par une agence
------------------------------------------------------------ */
export function teamPermissions(teamId: string): string[] {
  return [
    Permission.read(Role.any()),
    Permission.update(Role.team(teamId)),
    Permission.update(Role.label('superadmin')),
    Permission.delete(Role.team(teamId, 'owner')),
    Permission.delete(Role.team(teamId, 'admin')),
    Permission.delete(Role.label('superadmin')),
  ]
}

const emptyToNull = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? '').trim()
  return trimmed === '' ? null : trimmed
}
export { emptyToNull }

/** Slug unique dans une collection (ajoute -2, -3… si besoin). */
async function uniqueSlug(collectionId: string, base: string): Promise<string> {
  const root = slugify(base) || 'element'
  let candidate = root

  for (let attempt = 2; attempt < 60; attempt += 1) {
    const { total } = await listDocuments<BaseDoc>(collectionId, [
      Query.equal('slug', candidate),
      Query.limit(1),
    ])
    if (total === 0) return candidate
    candidate = `${root}-${attempt}`
  }
  throw new AppError('Impossible de générer une adresse unique pour cet élément.', 'SLUG_EXHAUSTED')
}

/* ------------------------------------------------------------
   Agences
------------------------------------------------------------ */
export async function listAgencies(): Promise<Agency[]> {
  const { documents } = await listDocuments<Agency>(COLLECTIONS.agencies, [
    Query.orderAsc('name'),
    Query.limit(100),
  ])
  return documents
}

export async function getAgenciesByIds(ids: string[]): Promise<Agency[]> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return []
  const { documents } = await listDocuments<Agency>(COLLECTIONS.agencies, [
    Query.equal('$id', unique),
    Query.limit(unique.length),
  ])
  return documents
}

export type AgencySettingsInput = Partial<
  Pick<
    Agency,
    | 'name'
    | 'description'
    | 'phone'
    | 'whatsapp'
    | 'email'
    | 'website'
    | 'address'
    | 'city'
    | 'primaryColor'
    | 'logoId'
    | 'coverId'
  >
>

const SETTINGS_KEYS: (keyof AgencySettingsInput)[] = [
  'name',
  'description',
  'phone',
  'whatsapp',
  'email',
  'website',
  'address',
  'city',
  'primaryColor',
  'logoId',
  'coverId',
]

/** N'envoie que les champs que l'agence a le droit de modifier (jamais la licence ni la commission). */
export function updateAgencySettings(agencyId: string, input: AgencySettingsInput): Promise<Agency> {
  const data: Record<string, unknown> = {}
  SETTINGS_KEYS.forEach((key) => {
    if (key in input) data[key] = input[key]
  })
  return updateDocument<Agency>(COLLECTIONS.agencies, agencyId, data)
}

/* ------------------------------------------------------------
   Sites
------------------------------------------------------------ */
export type SiteInput = Omit<
  Site,
  keyof BaseDoc | 'agencyId' | 'slug' | 'geohash' | 'ratingAvg' | 'ratingCount' | 'publishedAt'
>

export function listAgencySites(
  agencyId: string,
  options: { q?: string; status?: PublishStatus; limit?: number; offset?: number } = {},
): Promise<ListResult<Site>> {
  const queries: string[] = [Query.equal('agencyId', agencyId)]
  if (options.status) queries.push(Query.equal('status', options.status))
  const term = options.q?.trim()
  if (term) queries.push(Query.search('name', term))
  queries.push(Query.orderDesc('$createdAt'))
  queries.push(Query.limit(options.limit ?? 50))
  queries.push(Query.offset(options.offset ?? 0))
  return listDocuments<Site>(COLLECTIONS.sites, queries)
}

/** Sites auxquels une offre ou un guide peut être rattaché : ceux de l'agence + le catalogue commun publié. */
export async function listSelectableSites(agencyId: string): Promise<Site[]> {
  const [own, shared] = await Promise.all([
    listDocuments<Site>(COLLECTIONS.sites, [Query.equal('agencyId', agencyId), Query.orderAsc('name'), Query.limit(100)]),
    listDocuments<Site>(COLLECTIONS.sites, [
      Query.isNull('agencyId'),
      Query.equal('status', 'published'),
      Query.orderAsc('name'),
      Query.limit(100),
    ]),
  ])

  const byId = new Map<string, Site>()
  ;[...own.documents, ...shared.documents].forEach((site) => byId.set(site.$id, site))
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export async function saveSite(agency: Agency, input: SiteInput, existing?: Site | null): Promise<Site> {
  const data: Record<string, unknown> = {
    ...input,
    geohash: encodeGeohash(input.latitude, input.longitude, 9),
  }

  if (existing) {
    if (input.status === 'published' && !existing.publishedAt) {
      data.publishedAt = new Date().toISOString()
    }
    return updateDocument<Site>(COLLECTIONS.sites, existing.$id, data)
  }

  data.agencyId = agency.$id
  data.slug = await uniqueSlug(COLLECTIONS.sites, input.name)
  data.ratingAvg = 0
  data.ratingCount = 0
  data.publishedAt = input.status === 'published' ? new Date().toISOString() : null

  return createDocument<Site>(COLLECTIONS.sites, data, { permissions: teamPermissions(agency.teamId) })
}

export function deleteSite(siteId: string): Promise<void> {
  return deleteDocument(COLLECTIONS.sites, siteId)
}

/* ------------------------------------------------------------
   Guides
------------------------------------------------------------ */
export type GuideInput = Omit<
  Guide,
  keyof BaseDoc | 'agencyId' | 'userId' | 'slug' | 'ratingAvg' | 'ratingCount'
>

export async function listAgencyGuides(agencyId: string): Promise<Guide[]> {
  const { documents } = await listDocuments<Guide>(COLLECTIONS.guides, [
    Query.equal('agencyId', agencyId),
    Query.orderAsc('fullName'),
    Query.limit(100),
  ])
  return documents
}

export async function saveGuide(agency: Agency, input: GuideInput, existing?: Guide | null): Promise<Guide> {
  if (existing) {
    return updateDocument<Guide>(COLLECTIONS.guides, existing.$id, { ...input })
  }

  return createDocument<Guide>(
    COLLECTIONS.guides,
    {
      ...input,
      agencyId: agency.$id,
      slug: await uniqueSlug(COLLECTIONS.guides, input.fullName),
      ratingAvg: 0,
      ratingCount: 0,
    },
    { permissions: teamPermissions(agency.teamId) },
  )
}

export function deleteGuide(guideId: string): Promise<void> {
  return deleteDocument(COLLECTIONS.guides, guideId)
}

/* ------------------------------------------------------------
   Offres (prestations et tarifs)
------------------------------------------------------------ */
export type OfferInput = Omit<Offer, keyof BaseDoc | 'agencyId'>

/** Toutes les offres de l'agence, y compris désactivées. */
export async function listAgencyOffers(agencyId: string): Promise<Offer[]> {
  const { documents } = await listDocuments<Offer>(COLLECTIONS.offers, [
    Query.equal('agencyId', agencyId),
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ])
  return documents
}

export function saveOffer(agency: Agency, input: OfferInput, existing?: Offer | null): Promise<Offer> {
  if (existing) {
    return updateDocument<Offer>(COLLECTIONS.offers, existing.$id, { ...input })
  }
  return createDocument<Offer>(
    COLLECTIONS.offers,
    { ...input, agencyId: agency.$id },
    { permissions: teamPermissions(agency.teamId) },
  )
}

export function setOfferActive(offerId: string, isActive: boolean): Promise<Offer> {
  return updateDocument<Offer>(COLLECTIONS.offers, offerId, { isActive })
}

export function deleteOffer(offerId: string): Promise<void> {
  return deleteDocument(COLLECTIONS.offers, offerId)
}

/* ------------------------------------------------------------
   Créneaux (offres en mode "slots")
------------------------------------------------------------ */
/** Tous les créneaux à partir d'une date, y compris fermés. */
export async function listOfferSlots(offerId: string, fromKey: string): Promise<Availability[]> {
  const { documents } = await listDocuments<Availability>(COLLECTIONS.availabilities, [
    Query.equal('offerId', offerId),
    Query.greaterThanEqual('dateKey', fromKey),
    Query.orderAsc('dateKey'),
    Query.orderAsc('startTime'),
    Query.limit(200),
  ])
  return documents
}

/** Dates "YYYY-MM-DD" entre deux dates incluses, restreintes à certains jours (0 = dimanche). */
export function expandDates(fromKey: string, toKey: string, weekdays: number[]): string[] {
  const dates: string[] = []
  const cursor = fromDateKey(fromKey)
  const end = fromDateKey(toKey)

  while (cursor <= end && dates.length < 400) {
    if (weekdays.includes(cursor.getDay())) dates.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export interface CreateSlotsInput {
  dates: string[]
  /** "HH:mm" */
  times: string[]
  capacity: number
  priceOverride: number | null
}

/** Crée les créneaux (date × horaire). Ignore ceux qui existent déjà. Renvoie le nombre créé. */
export async function createSlots(offer: Offer, teamId: string, input: CreateSlotsInput): Promise<number> {
  const combos = input.dates.flatMap((dateKey) => input.times.map((startTime) => ({ dateKey, startTime })))
  let created = 0

  for (let index = 0; index < combos.length; index += 10) {
    const chunk = combos.slice(index, index + 10)
    const results = await Promise.allSettled(
      chunk.map(({ dateKey, startTime }) =>
        createDocument<Availability>(
          COLLECTIONS.availabilities,
          {
            offerId: offer.$id,
            agencyId: offer.agencyId,
            dateKey,
            startTime,
            capacity: input.capacity,
            booked: 0,
            priceOverride: input.priceOverride,
            status: 'open',
          },
          { permissions: teamPermissions(teamId) },
        ),
      ),
    )

    results.forEach((result) => {
      if (result.status === 'fulfilled') created += 1
      // Un créneau déjà existant (index unique) est simplement ignoré
      else if (!(result.reason && (result.reason as { code?: number }).code === 409)) throw result.reason
    })
  }

  return created
}

export function updateSlot(
  slotId: string,
  patch: Partial<Pick<Availability, 'capacity' | 'status' | 'priceOverride'>>,
): Promise<Availability> {
  return updateDocument<Availability>(COLLECTIONS.availabilities, slotId, { ...patch })
}

export function deleteSlot(slotId: string): Promise<void> {
  return deleteDocument(COLLECTIONS.availabilities, slotId)
}

/* ------------------------------------------------------------
   Photos
------------------------------------------------------------ */
export type ImageBucket = keyof typeof BUCKETS

export async function uploadImage(bucket: ImageBucket, file: File): Promise<string> {
  const problem = validateImageFile(file)
  if (problem) throw new AppError(problem, 'INVALID_FILE')

  const uploaded = await storage.createFile(BUCKETS[bucket], ID.unique(), file)
  return uploaded.$id
}

/* ------------------------------------------------------------
   Tableau de bord
------------------------------------------------------------ */
export interface AgencyStats {
  pendingBookings: number
  visitsToday: number
  upcoming: Booking[]
  monthRevenue: number
  pendingReviews: number
  sites: number
  guides: number
  offers: number
}

export async function getAgencyStats(agency: Agency): Promise<AgencyStats> {
  const now = new Date()
  const today = toDateKey(now)
  const in14 = new Date(now)
  in14.setDate(in14.getDate() + 14)
  const monthStart = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1))
  const monthEnd = toDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0))

  const count = (collectionId: string) =>
    listDocuments<BaseDoc>(collectionId, [Query.equal('agencyId', agency.$id), Query.limit(1)])

  const [pending, upcoming, month, reviews, sites, guides, offers] = await Promise.all([
    listAgencyBookings(agency.$id, { status: ['pending'], limit: 1 }),
    listAgencyBookings(agency.$id, { status: ['confirmed'], from: today, to: toDateKey(in14), limit: 100 }),
    listAgencyBookings(agency.$id, { status: ['confirmed', 'completed'], from: monthStart, to: monthEnd, limit: 200 }),
    listAgencyReviews(agency.$id, 'pending', 1),
    count(COLLECTIONS.sites),
    count(COLLECTIONS.guides),
    count(COLLECTIONS.offers),
  ])

  const sortedUpcoming = [...upcoming.documents].sort((a, b) => a.visitDate.localeCompare(b.visitDate))

  return {
    pendingBookings: pending.total,
    visitsToday: sortedUpcoming.filter((booking) => isoToDateKey(booking.visitDate) === today).length,
    upcoming: sortedUpcoming.slice(0, 5),
    monthRevenue: month.documents.reduce((sum, booking) => sum + booking.totalAmount, 0),
    pendingReviews: reviews.total,
    sites: sites.total,
    guides: guides.total,
    offers: offers.total,
  }
}

/** Utile aux formulaires : vérifie qu'un document existe encore (ex: après une suppression ailleurs). */
export async function agencyExists(agencyId: string): Promise<boolean> {
  try {
    await getDocument<Agency>(COLLECTIONS.agencies, agencyId)
    return true
  } catch {
    return false
  }
}