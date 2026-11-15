import { useShallow } from 'zustand/react/shallow'

import { useAuthStore } from '@/store/auth.store'

/** Acces simplifie a l'etat de connexion et aux actions. */
export function useAuth() {
  const state = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      profile: s.profile,
      memberships: s.memberships,
      role: s.role,
      status: s.status,
      isInitialized: s.isInitialized,
      isBusy: s.isBusy,
      error: s.error,
    })),
  )

  const actions = useAuthStore(
    useShallow((s) => ({
      loginWithEmail: s.loginWithEmail,
      signUpWithEmail: s.signUpWithEmail,
      loginWithGoogle: s.loginWithGoogle,
      completeOAuth: s.completeOAuth,
      logout: s.logout,
      updateProfile: s.updateProfile,
      refreshProfile: s.refreshProfile,
      clearError: s.clearError,
    })),
  )

  return {
    ...state,
    ...actions,
    isAuthenticated: state.status === 'authenticated',
    /** Vrai tant qu'on ne sait pas encore si le visiteur est connecte */
    isChecking: !state.isInitialized,
    isAgencyStaff: state.role === 'agency_staff' || state.role === 'superadmin',
    isSuperAdmin: state.role === 'superadmin',
  }
}