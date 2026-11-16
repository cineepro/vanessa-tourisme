// src/config/appwrite-ids.ts — Vanessa Tourisme
import { env } from './env'

/**
 * IDs des collections et buckets Appwrite.
 * Les collections tourisme sont prefixees `tour_`.
 * `users` est la collection PARTAGEE avec Vanessa (jamais modifiee ici).
 */
export const COLLECTIONS = {
  users: env.collectionUsers,

  agencies: 'tour_agencies',
  profiles: 'tour_profiles',
  sites: 'tour_sites',
  guides: 'tour_guides',
  offers: 'tour_offers',
  availabilities: 'tour_availabilities',
  bookings: 'tour_bookings',
  payments: 'tour_payments',
  reviews: 'tour_reviews',
  favorites: 'tour_favorites',
  conversations: 'tour_conversations',
  messages: 'tour_messages',
  places: 'tour_places',
  articles: 'tour_articles',
  notifications: 'tour_notifications',
  chatUsage: 'tour_chat_usage',
} as const

export const BUCKETS = {
  sites: 'tour_sites_media',
  guides: 'tour_guides_media',
  articles: 'tour_articles_media',
  agencies: 'tour_agency_assets',
  reviews: 'tour_review_photos',
} as const

/** IDs des Appwrite Functions (voir .env) */
export const FUNCTIONS = {
  chat: env.fn.chat,
  createBooking: env.fn.createBooking,
  bookingStatus: env.fn.bookingStatus,
  review: env.fn.review,
} as const

export type CollectionKey = keyof typeof COLLECTIONS
export type BucketKey = keyof typeof BUCKETS