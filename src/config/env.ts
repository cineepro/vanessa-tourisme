// src/config/env.ts — Vanessa Tourisme
/**
 * Lecture typee des variables d'environnement (prefixe VITE_).
 * Aucune cle secrete ici : tout ce fichier finit dans le bundle public.
 */

const raw = import.meta.env

const clean = (value: string | undefined): string => (value ?? '').trim()

export const env = {
  appwriteEndpoint:
    clean(raw.VITE_APPWRITE_ENDPOINT) || 'https://cloud.appwrite.io/v1',
  projectId: clean(raw.VITE_APPWRITE_PROJECT_ID),
  databaseId: clean(raw.VITE_APPWRITE_DATABASE_ID),
  /** ID de la collection `users` PARTAGÉE avec Vanessa (même valeur que son .env) */
  collectionUsers: clean(raw.VITE_APPWRITE_COLLECTION_USERS),

  appUrl:
    clean(raw.VITE_APP_URL) ||
    (typeof window !== 'undefined' ? window.location.origin : ''),
  vanessaAppUrl: clean(raw.VITE_VANESSA_APP_URL),

  mapStyleUrl:
    clean(raw.VITE_MAP_STYLE_URL) || 'https://demotiles.maplibre.org/style.json',

  /** IDs des Appwrite Functions */
  fn: {
    chat: clean(raw.VITE_FN_TOUR_CHAT) || 'tour-chat',
    createBooking: clean(raw.VITE_FN_CREATE_BOOKING) || 'tour-create-booking',
    bookingStatus: clean(raw.VITE_FN_BOOKING_STATUS) || 'tour-booking-status',
    review: clean(raw.VITE_FN_REVIEW) || 'tour-review',
  },

  /** IDs des collections Appwrite */
  collections: {
    users: clean(raw.VITE_APPWRITE_COLLECTION_USERS),
    agencies: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_AGENCIES) || 'tour_agencies',
    profiles: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_PROFILES) || 'tour_profiles',
    sites: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_SITES) || 'tour_sites',
    guides: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_GUIDES) || 'tour_guides',
    offers: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_OFFERS) || 'tour_offers',
    availabilities:
      clean(raw.VITE_APPWRITE_COLLECTION_TOUR_AVAILABILITIES) || 'tour_availabilities',
    bookings: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_BOOKINGS) || 'tour_bookings',
    payments: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_PAYMENTS) || 'tour_payments',
    reviews: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_REVIEWS) || 'tour_reviews',
    favorites: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_FAVORITES) || 'tour_favorites',
    conversations:
      clean(raw.VITE_APPWRITE_COLLECTION_TOUR_CONVERSATIONS) || 'tour_conversations',
    messages: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_MESSAGES) || 'tour_messages',
    places: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_PLACES) || 'tour_places',
    articles: clean(raw.VITE_APPWRITE_COLLECTION_TOUR_ARTICLES) || 'tour_articles',
    notifications:
      clean(raw.VITE_APPWRITE_COLLECTION_TOUR_NOTIFICATIONS) || 'tour_notifications',
    chatUsage:
      clean(raw.VITE_APPWRITE_COLLECTION_TOUR_CHAT_USAGE) || 'tour_chat_usage',
  },

  /** IDs des buckets Storage Appwrite */
  buckets: {
    sites: clean(raw.VITE_APPWRITE_BUCKET_TOUR_SITES) || 'tour_sites',
    guides: clean(raw.VITE_APPWRITE_BUCKET_TOUR_GUIDES) || 'tour_guides',
    articles: clean(raw.VITE_APPWRITE_BUCKET_TOUR_ARTICLES) || 'tour_articles',
    agencies: clean(raw.VITE_APPWRITE_BUCKET_TOUR_AGENCIES) || 'tour_agencies',
    reviews: clean(raw.VITE_APPWRITE_BUCKET_TOUR_REVIEWS) || 'tour_reviews',
  },

  isDev: raw.DEV,
  isProd: raw.PROD,
} as const

/** Variables obligatoires encore vides (affichees par App.tsx). */
export const missingEnv: string[] = [
  !env.projectId && 'VITE_APPWRITE_PROJECT_ID',
  !env.databaseId && 'VITE_APPWRITE_DATABASE_ID',
  !env.collectionUsers && 'VITE_APPWRITE_COLLECTION_USERS',
].filter((name): name is string => Boolean(name))