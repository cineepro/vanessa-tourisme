import { COLLECTIONS, FUNCTIONS } from '@/config/appwrite-ids'
import { executeFunction, getDocument, listDocuments, Query } from '@/lib/appwrite'
import { isoToDateKey, toDateKey } from '@/lib/format'
import type {
  Booking,
  BookingStatus,
  CreateBookingInput,
  ListResult,
  UpdateBookingStatusInput,
} from '@/types'

/* ------------------------------------------------------------
   Actions (passent par les Functions : prix et capacite serveur)
------------------------------------------------------------ */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const result = await executeFunction<{ booking: Booking }>(FUNCTIONS.createBooking, input)
  return result.booking
}

export async function updateBookingStatus(input: UpdateBookingStatusInput): Promise<Booking> {
  const result = await executeFunction<{ booking: Booking }>(FUNCTIONS.bookingStatus, input)
  return result.booking
}

export function cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
  return updateBookingStatus({ bookingId, action: 'cancel', reason })
}

/* ------------------------------------------------------------
   Lecture
------------------------------------------------------------ */
export function getBooking(id: string): Promise<Booking> {
  return getDocument<Booking>(COLLECTIONS.bookings, id)
}

export async function listMyBookings(
  userId: string,
  options: { status?: BookingStatus[]; limit?: number; offset?: number } = {},
): Promise<ListResult<Booking>> {
  const queries: string[] = [Query.equal('userId', userId)]
  if (options.status?.length) queries.push(Query.equal('status', options.status))
  queries.push(Query.orderDesc('visitDate'))
  queries.push(Query.limit(options.limit ?? 50))
  queries.push(Query.offset(options.offset ?? 0))
  return listDocuments<Booking>(COLLECTIONS.bookings, queries)
}

export interface AgencyBookingFilters {
  status?: BookingStatus[]
  /** "YYYY-MM-DD" */
  from?: string
  to?: string
  guideId?: string
  limit?: number
  offset?: number
}

/** Reservations d'une agence (espace agence). */
export function listAgencyBookings(
  agencyId: string,
  filters: AgencyBookingFilters = {},
): Promise<ListResult<Booking>> {
  const queries: string[] = [Query.equal('agencyId', agencyId)]

  if (filters.status?.length) queries.push(Query.equal('status', filters.status))
  if (filters.guideId) queries.push(Query.equal('guideId', filters.guideId))
  if (filters.from) queries.push(Query.greaterThanEqual('visitDate', `${filters.from}T00:00:00.000Z`))
  if (filters.to) queries.push(Query.lessThanEqual('visitDate', `${filters.to}T23:59:59.999Z`))

  queries.push(Query.orderDesc('visitDate'))
  queries.push(Query.limit(filters.limit ?? 50))
  queries.push(Query.offset(filters.offset ?? 0))
  return listDocuments<Booking>(COLLECTIONS.bookings, queries)
}

/* ------------------------------------------------------------
   Regles d'affichage
------------------------------------------------------------ */
export function isUpcoming(booking: Booking): boolean {
  return isoToDateKey(booking.visitDate) >= toDateKey(new Date())
}

export function canCancel(booking: Booking): boolean {
  return (booking.status === 'pending' || booking.status === 'confirmed') && isUpcoming(booking)
}

export function canReview(booking: Booking): boolean {
  return booking.status === 'completed' && !booking.reviewed
}

/** Separe les reservations a venir de l'historique. */
export function splitBookings(bookings: Booking[]): { upcoming: Booking[]; past: Booking[] } {
  const activeStatuses: BookingStatus[] = ['pending', 'confirmed']
  const upcoming = bookings
    .filter((b) => activeStatuses.includes(b.status) && isUpcoming(b))
    .sort((a, b) => a.visitDate.localeCompare(b.visitDate))
  const past = bookings.filter((b) => !upcoming.includes(b))
  return { upcoming, past }
}