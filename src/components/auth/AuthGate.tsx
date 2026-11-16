// src/components/auth/AuthGate.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/ui.store'

interface AuthGateProps {
  children: ReactNode
  title?: string
  description?: string
  /** Remplace la carte de connexion par défaut */
  fallback?: ReactNode
}

/**
 * Affiche son contenu aux comptes connectés, sinon invite à se connecter
 * (sans quitter la page). Pour protéger une page entière, voir ProtectedRoute.
 */
export function AuthGate({
  children,
  title = 'Connectez-vous pour continuer',
  description = 'Un compte est nécessaire pour discuter avec Vanessa, réserver et gérer vos favoris.',
  fallback,
}: AuthGateProps) {
  const { isAuthenticated, isChecking } = useAuth()
  const openAuthModal = useUiStore((s) => s.openAuthModal)
  const location = useLocation()
  const here = location.pathname + location.search

  if (isChecking) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (isAuthenticated) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-sable-200 bg-white p-8 text-center shadow-card">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-700">
        <Lock className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-sable-900">{title}</h2>
      <p className="mt-2 text-sm text-sable-600">{description}</p>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => openAuthModal('login', here)}>
          Se connecter
        </Button>
        <Button onClick={() => openAuthModal('signup', here)}>Créer un compte</Button>
      </div>
    </div>
  )
}