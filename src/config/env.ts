// src/config/env.ts — Vanessa Tourisme
/**
 * Lecture typée des variables d'environnement (préfixe VITE_).
 * Aucune clé secrète ici : tout ce fichier finit dans le bundle public.
 *
 * Les IDs des collections et des buckets sont configurables (comme sur Vanessa) :
 * si une variable est absente, on utilise l'ID par défaut `tour_...`.
 */

const raw = import.meta.env

const clean = (value: string | undefined): string => (value ?? '').trim()
const pick = (value: string | undefined, fallback: string): string => clean(value) || fallback

export const env = {
  appwriteEndpoint:
    clean(raw.VITE_APPWRITE_ENDPOINT) || 'https://cloud.appwrite.io/v1',
  projectId: clean(raw.VITE_APPWRITE_PROJECT_ID),
  databaseId: clean(raw.VITE_APPWRITE_DATABASE_ID),
  /** ID de la collection `users` PARTAGÉE avec Vanessa (même valeur que son .env) */
  collectionUsers: clean(raw.VITE_APPWRITE_COLLECTION_USERS),

  /** IDs des collections tourisme (défaut : tour_...) */
  collections: {
    users: clean(raw.VITE_APPWRITE_COLLECTION_USERS),
    agencies: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_AGENCIES, 'tour_agencies'),
    profiles: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_PROFILES, 'tour_profiles'),
    sites: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_SITES, 'tour_sites'),
    guides: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_GUIDES, 'tour_guides'),
    offers: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_OFFERS, 'tour_offers'),
    availabilities: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_AVAILABILITIES, 'tour_availabilities'),
    bookings: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_BOOKINGS, 'tour_bookings'),
    payments: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_PAYMENTS, 'tour_payments'),
    reviews: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_REVIEWS, 'tour_reviews'),
    favorites: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_FAVORITES, 'tour_favorites'),
    conversations: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_CONVERSATIONS, 'tour_conversations'),
    messages: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_MESSAGES, 'tour_messages'),
    places: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_PLACES, 'tour_places'),
    articles: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_ARTICLES, 'tour_articles'),
    notifications: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_NOTIFICATIONS, 'tour_notifications'),
    chatUsage: pick(raw.VITE_APPWRITE_COLLECTION_TOUR_CHAT_USAGE, 'tour_chat_usage'),
  },

  /** IDs des buckets de photos (défaut : tour_...) */
  buckets: {
    sites: pick(raw.VITE_APPWRITE_BUCKET_TOUR_SITES, 'tour_sites_media'),
    guides: pick(raw.VITE_APPWRITE_BUCKET_TOUR_GUIDES, 'tour_guides_media'),
    articles: pick(raw.VITE_APPWRITE_BUCKET_TOUR_ARTICLES, 'tour_articles_media'),
    agencies: pick(raw.VITE_APPWRITE_BUCKET_TOUR_AGENCIES, 'tour_agency_assets'),
    reviews: pick(raw.VITE_APPWRITE_BUCKET_TOUR_REVIEWS, 'tour_review_photos'),
  },

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

  isDev: raw.DEV,
  isProd: raw.PROD,
} as const

/** Variables obligatoires encore vides (affichées par App.tsx). */
export const missingEnv: string[] = [
  !env.projectId && 'VITE_APPWRITE_PROJECT_ID',
  !env.databaseId && 'VITE_APPWRITE_DATABASE_ID',
  !env.collectionUsers && 'VITE_APPWRITE_COLLECTION_USERS',
].filter((name): name is string => Boolean(name))