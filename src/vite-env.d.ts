// src/vite-env.d.ts — Vanessa Tourisme
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_DATABASE_ID: string
  readonly VITE_APPWRITE_COLLECTION_USERS: string
  readonly VITE_APP_URL: string
  readonly VITE_VANESSA_APP_URL: string
  readonly VITE_FN_TOUR_CHAT: string
  readonly VITE_FN_CREATE_BOOKING: string
  readonly VITE_FN_BOOKING_STATUS: string
  readonly VITE_FN_REVIEW: string
  readonly VITE_MAP_STYLE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Les polices Fontsource ne sont que du CSS : on les déclare pour TypeScript 6. */
declare module '@fontsource-variable/*'