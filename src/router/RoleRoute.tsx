// src/router/RoleRoute.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PageLoader } from '@/components/ui/Spinner'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

interface RoleRouteProps {
  /** Rôles autorisés (par défaut : personnel d'agence et super-admin) */
  allow?: UserRole[]
  children?: ReactNode
  /** Où renvoyer un utilisateur connecté sans le bon rôle */
  redirectTo?: string
}

/** Espace agence / super-admin : connexion requise + rôle autorisé. */
export function RoleRoute({
  allow = ['agency_staff', 'superadmin'],
  children,
  redirectTo = ROUTES.home,
}: RoleRouteProps) {
  const { isAuthenticated, isChecking, role } = useAuth()
  const location = useLocation()

  if (isChecking) return <PageLoader />

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTES.login}?next=${next}`} replace />
  }

  if (!allow.includes(role)) return <Navigate to={redirectTo} replace />

  return <>{children ?? <Outlet />}</>
}