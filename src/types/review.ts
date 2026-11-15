import type { BaseDoc } from './index'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

/** Collection `tour_reviews` */
export interface Review extends BaseDoc {
  userId: string
  bookingId: string
  siteId: string
  guideId: string | null
  agencyId: string
  /** 1 a 5 */
  ratingSite: number
  ratingGuide: number | null
  comment: string | null
  photos: string[]
  /** Prenom + initiale, jamais l'email */
  userDisplayName: string
  visitedAt: string | null
  status: ReviewStatus
  agencyReply: string | null
  agencyReplyAt: string | null
}

/** Envoye a la Function `tour-review` */
export interface CreateReviewInput {
  bookingId: string
  ratingSite: number
  ratingGuide?: number
  comment?: string
  photos?: string[]
}