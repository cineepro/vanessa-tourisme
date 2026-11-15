import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth.store'
import { useUiStore, type AuthModalMode } from '@/store/ui.store'

interface RequireAuthOptions {
  mode?: AuthModalMode
  /** Page a ouvrir apres connexion (par defaut : la page actuelle) */
  redirectTo?: string
  /** Execute tout de suite si deja connecte */
  onSuccess?: () => void
}

/**
 * Pour les actions reservees aux comptes (discuter avec Vanessa, reserver...).
 * Renvoie true si connecte, sinon ouvre la fenetre de connexion.
 *
 *   const requireAuth = useRequireAuth()
 *   <button onClick={() => requireAuth({ onSuccess: openChat })}>Discuter</button>
 */
export function useRequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated')
  const openAuthModal = useUiStore((s) => s.openAuthModal)
  const location = useLocation()

  return useCallback(
    (options: RequireAuthOptions = {}): boolean => {
      if (isAuthenticated) {
        options.onSuccess?.()
        return true
      }
      openAuthModal(options.mode ?? 'login', options.redirectTo ?? location.pathname + location.search)
      return false
    },
    [isAuthenticated, openAuthModal, location.pathname, location.search],
  )
}