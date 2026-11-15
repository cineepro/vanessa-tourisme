import { COLLECTIONS, FUNCTIONS } from '@/config/appwrite-ids'
import { executeFunction, listDocuments, Query } from '@/lib/appwrite'
import type { CreateReviewInput, ListResult, Review } from '@/types'

/* ------------------------------------------------------------
   Lecture publique (avis approuves uniquement)
------------------------------------------------------------ */
export function listSiteReviews(
  siteId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<ListResult<Review>> {
  return listDocuments<Review>(COLLECTIONS.reviews, [
    Query.equal('siteId', siteId),
    Query.equal('status', 'approved'),
    Query.orderDesc('$createdAt'),
    Query.limit(options.limit ?? 10),
    Query.offset(options.offset ?? 0),
  ])
}

export function listGuideReviews(
  guideId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<ListResult<Review>> {
  return listDocuments<Review>(COLLECTIONS.reviews, [
    Query.equal('guideId', guideId),
    Query.equal('status', 'approved'),
    Query.orderDesc('$createdAt'),
    Query.limit(options.limit ?? 10),
    Query.offset(options.offset ?? 0),
  ])
}

/** Avis deja laisse par l'utilisateur pour une reservation (ou null). */
export async function getMyReviewForBooking(bookingId: string): Promise<Review | null> {
  const { documents } = await listDocuments<Review>(COLLECTIONS.reviews, [
    Query.equal('bookingId', bookingId),
    Query.limit(1),
  ])
  return documents[0] ?? null
}

/* ------------------------------------------------------------
   Actions (Function `tour-review`, routes /create, /reply, /moderate)
------------------------------------------------------------ */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const result = await executeFunction<{ review: Review }>(FUNCTIONS.review, input, {
    path: '/create',
  })
  return result.review
}

/* ---------------- Espace agence ---------------- */
export function listAgencyReviews(
  agencyId: string,
  status: Review['status'] = 'pending',
  limit = 50,
): Promise<ListResult<Review>> {
  return listDocuments<Review>(COLLECTIONS.reviews, [
    Query.equal('agencyId', agencyId),
    Query.equal('status', status),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ])
}

export async function replyToReview(reviewId: string, reply: string): Promise<Review> {
  const result = await executeFunction<{ review: Review }>(
    FUNCTIONS.review,
    { reviewId, reply },
    { path: '/reply' },
  )
  return result.review
}

export async function moderateReview(
  reviewId: string,
  decision: 'approve' | 'reject',
): Promise<Review> {
  const result = await executeFunction<{ review: Review }>(
    FUNCTIONS.review,
    { reviewId, decision },
    { path: '/moderate' },
  )
  return result.review
}