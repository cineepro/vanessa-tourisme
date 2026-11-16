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

  isDev: raw.DEV,
  isProd: raw.PROD,
} as const

/** Variables obligatoires encore vides (affichees par App.tsx). */
export const missingEnv: string[] = [
  !env.projectId && 'VITE_APPWRITE_PROJECT_ID',
  !env.databaseId && 'VITE_APPWRITE_DATABASE_ID',
  !env.collectionUsers && 'VITE_APPWRITE_COLLECTION_USERS',
].filter((name): name is string => Boolean(name))