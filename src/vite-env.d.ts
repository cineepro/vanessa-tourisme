// src/vite-env.d.ts — Vanessa Tourisme
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_DATABASE_ID: string
  readonly VITE_APPWRITE_COLLECTION_USERS: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_AGENCIES?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_PROFILES?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_SITES?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_GUIDES?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_OFFERS?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_AVAILABILITIES?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_BOOKINGS?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_PAYMENTS?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_REVIEWS?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_FAVORITES?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_CONVERSATIONS?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_MESSAGES?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_PLACES?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_ARTICLES?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_NOTIFICATIONS?: string
  readonly VITE_APPWRITE_COLLECTION_TOUR_CHAT_USAGE?: string
  readonly VITE_APPWRITE_BUCKET_TOUR_SITES?: string
  readonly VITE_APPWRITE_BUCKET_TOUR_GUIDES?: string
  readonly VITE_APPWRITE_BUCKET_TOUR_ARTICLES?: string
  readonly VITE_APPWRITE_BUCKET_TOUR_AGENCIES?: string
  readonly VITE_APPWRITE_BUCKET_TOUR_REVIEWS?: string
  readonly VITE_APP_URL: string
  readonly VITE_VANESSA_APP_URL: string
  readonly VITE_FN_TOUR_CHAT?: string
  readonly VITE_FN_CREATE_BOOKING?: string
  readonly VITE_FN_BOOKING_STATUS?: string
  readonly VITE_FN_REVIEW?: string
  readonly VITE_MAP_STYLE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Les polices Fontsource ne sont que du CSS : on les déclare pour TypeScript 6. */
declare module '@fontsource-variable/*'