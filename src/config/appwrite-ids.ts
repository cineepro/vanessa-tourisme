// src/config/appwrite-ids.ts — Vanessa Tourisme
import { env } from './env'

/**
 * IDs des collections et buckets Appwrite, lus depuis l'environnement (voir env.ts).
 * `users` est la collection PARTAGÉE avec Vanessa (jamais modifiée ici).
 */
export const COLLECTIONS = {
  users: env.collections.users,

  agencies: env.collections.agencies,
  profiles: env.collections.profiles,
  sites: env.collections.sites,
  guides: env.collections.guides,
  offers: env.collections.offers,
  availabilities: env.collections.availabilities,
  bookings: env.collections.bookings,
  payments: env.collections.payments,
  reviews: env.collections.reviews,
  favorites: env.collections.favorites,
  conversations: env.collections.conversations,
  messages: env.collections.messages,
  places: env.collections.places,
  articles: env.collections.articles,
  notifications: env.collections.notifications,
  chatUsage: env.collections.chatUsage,
} as const

export const BUCKETS = {
  sites: env.buckets.sites,
  guides: env.buckets.guides,
  articles: env.buckets.articles,
  agencies: env.buckets.agencies,
  reviews: env.buckets.reviews,
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