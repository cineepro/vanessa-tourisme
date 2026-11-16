// src/store/auth.store.ts — Vanessa Tourisme
// isAuthenticated est strictement lié à emailVerification === true
// (comme sur Vanessa). Pas de persistance locale : la session Appwrite fait foi.
import { create } from 'zustand'

import { getErrorMessage } from '@/lib/appwrite'
import * as authService from '@/services/auth.service'
import type {
  AgencyMembership,
  SessionUser,
  TouristProfile,
  TouristProfileInput,
  UserRole,
} from '@/types'
import { useBookingStore } from './booking.store'
import { useChatStore } from './chat.store'
import { useNotificationsStore } from './notifications.store'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest'

/** 'unverified' : compte existant mais email pas encore confirmé -> /verify-email */
export type LoginResult = 'ok' | 'unverified' | 'error'
/** 'verify' : compte créé, email de vérification envoyé -> /verify-email */
export type SignUpResult = 'verify' | 'error'

interface AuthState {
  user: SessionUser | null
  profile: TouristProfile | null
  memberships: AgencyMembership[]
  role: UserRole
  status: AuthStatus
  isInitialized: boolean
  /** Connexion ou inscription en cours */
  isBusy: boolean
  error: string | null

  /** A appeler une fois au démarrage de l'application. */
  init: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<LoginResult>
  signUpWithEmail: (input: authService.SignUpInput) => Promise<SignUpResult>
  /** Redirige vers Google (la page se recharge au retour sur /oauth-callback). */
  loginWithGoogle: (next?: string) => void
  /** Finalise la session à partir de ?userId=...&secret=... (page /oauth-callback). */
  completeOAuth: (userId: string, secret: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (patch: TouristProfileInput) => Promise<boolean>
  clearError: () => void
}

let initPromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>()((set, get) => {
  /** Charge profil et agences, puis marque l'utilisateur comme connecté. */
  const hydrate = async (user: SessionUser): Promise<void> => {
    const { profile, memberships } = await authService.bootstrapSession(user)
    set({
      user,
      profile,
      memberships,
      role: authService.getUserRole(user, memberships),
      status: 'authenticated',
      isInitialized: true,
    })
  }

  const setGuest = (error: string | null = null): void =>
    set({
      user: null,
      profile: null,
      memberships: [],
      role: 'tourist',
      status: 'guest',
      isInitialized: true,
      error,
    })

  return {
    user: null,
    profile: null,
    memberships: [],
    role: 'tourist',
    status: 'idle',
    isInitialized: false,
    isBusy: false,
    error: null,

    init: () => {
      if (initPromise) return initPromise

      initPromise = (async () => {
        set({ status: 'loading' })
        try {
          const user = await authService.getCurrentUser()
          if (user) await hydrate(user)
          else setGuest()
        } catch (error) {
          // Réseau indisponible : on laisse naviguer en visiteur
          setGuest(getErrorMessage(error))
        }
      })()

      return initPromise
    },

    loginWithEmail: async (email, password) => {
      set({ isBusy: true, error: null })
      try {
        const user = await authService.loginWithEmail(email, password)
        await hydrate(user)
        set({ isBusy: false })
        return 'ok'
      } catch (error) {
        const unverified =
          error instanceof Error && 'code' in error && error.code === 'EMAIL_NOT_VERIFIED'
        set({ isBusy: false, error: unverified ? null : getErrorMessage(error) })
        return unverified ? 'unverified' : 'error'
      }
    },

    signUpWithEmail: async (input) => {
      set({ isBusy: true, error: null })
      try {
        await authService.signUpWithEmail(input)
        set({ isBusy: false })
        return 'verify'
      } catch (error) {
        set({ isBusy: false, error: getErrorMessage(error) })
        return 'error'
      }
    },

    loginWithGoogle: (next = '/') => {
      set({ error: null })
      authService.loginWithGoogle(next)
    },

    completeOAuth: async (userId, secret) => {
      set({ isBusy: true, error: null })
      try {
        const user = await authService.completeOAuthSession(userId, secret)
        await hydrate(user)
        set({ isBusy: false })
        return true
      } catch (error) {
        set({ isBusy: false, error: getErrorMessage(error) })
        return false
      }
    },

    logout: async () => {
      try {
        await authService.logout()
      } catch (error) {
        console.warn('[auth] déconnexion :', error)
      }
      // On vide aussi les données privées des autres stores
      useChatStore.getState().reset()
      useBookingStore.getState().reset()
      useNotificationsStore.getState().reset()
      initPromise = null
      setGuest()
    },

    refreshProfile: async () => {
      const user = get().user
      if (!user) return
      try {
        const profile = await authService.ensureProfile(user)
        set({ profile })
      } catch (error) {
        set({ error: getErrorMessage(error) })
      }
    },

    updateProfile: async (patch) => {
      const user = get().user
      if (!user) return false
      set({ error: null })
      try {
        const profile = await authService.updateProfile(user.id, patch)
        set({ profile })
        return true
      } catch (error) {
        set({ error: getErrorMessage(error) })
        return false
      }
    },

    clearError: () => set({ error: null }),
  }
})