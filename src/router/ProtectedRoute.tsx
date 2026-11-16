// src/router/ProtectedRoute.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PageLoader } from '@/components/ui/Spinner'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'

/**
 * Page réservée aux comptes (chat, réservation, profil...).
 * Un visiteur est renvoyé vers /login?next=... puis ramené ici après connexion.
 * Utilisable en enveloppe (<ProtectedRoute><Page/></ProtectedRoute>) ou comme
 * route parente (rend alors <Outlet />).
 */
export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { isAuthenticated, isChecking } = useAuth()
  const location = useLocation()

  if (isChecking) return <PageLoader />

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTES.login}?next=${next}`} replace />
  }

  return <>{children ?? <Outlet />}</>
}