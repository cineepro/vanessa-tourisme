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

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest'

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

  /** A appeler une fois au demarrage de l'application. */
  init: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<boolean>
  signUpWithEmail: (input: authService.SignUpInput) => Promise<boolean>
  /** Redirige vers Google (la page se recharge au retour). */
  loginWithGoogle: (next?: string) => void
  /** Finalise la session apres le retour de Google (/auth/callback). */
  completeOAuth: () => Promise<boolean>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (patch: TouristProfileInput) => Promise<boolean>
  clearError: () => void
}

let initPromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>()((set, get) => {
  /** Charge profil et agences, puis marque l'utilisateur comme connecte. */
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
          // Reseau indisponible : on laisse naviguer en visiteur
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
        return true
      } catch (error) {
        set({ isBusy: false, error: getErrorMessage(error) })
        return false
      }
    },

    signUpWithEmail: async (input) => {
      set({ isBusy: true, error: null })
      try {
        const user = await authService.signUpWithEmail(input)
        await hydrate(user)
        set({ isBusy: false })
        return true
      } catch (error) {
        set({ isBusy: false, error: getErrorMessage(error) })
        return false
      }
    },

    loginWithGoogle: (next = '/') => {
      set({ error: null })
      authService.loginWithGoogle(next)
    },

    completeOAuth: async () => {
      set({ isBusy: true, error: null })
      try {
        const user = await authService.getCurrentUser()
        if (!user) {
          setGuest('La connexion avec Google a échoué. Veuillez réessayer.')
          set({ isBusy: false })
          return false
        }
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
        console.warn('[auth] deconnexion :', error)
      }
      // On vide aussi les donnees privees des autres stores
      useChatStore.getState().reset()
      useBookingStore.getState().reset()
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