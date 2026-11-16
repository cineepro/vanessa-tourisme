// src/pages/auth/RegisterPage.tsx — Vanessa Tourisme
import { Link, Navigate, useSearchParams } from 'react-router-dom'

import { AuthCard } from '@/components/auth/AuthCard'
import { SignupForm } from '@/components/auth/SignupForm'
import { PageLoader } from '@/components/ui/Spinner'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { sanitizeRedirect } from '@/services/auth.service'

export default function RegisterPage() {
  useDocumentTitle('Créer un compte')
  const [params] = useSearchParams()
  const { isAuthenticated, isChecking } = useAuth()

  const next = sanitizeRedirect(params.get('next'))

  if (isChecking) return <PageLoader />
  if (isAuthenticated) return <Navigate to={next} replace />

  return (
    <AuthCard
      title="Créer votre compte"
      subtitle="Un seul compte pour Vanessa et Vanessa Tourisme. Déjà inscrit sur Vanessa ? Connectez-vous directement."
      footer={
        <>
          Déjà un compte ?{' '}
          <Link
            to={next === '/' ? ROUTES.login : `${ROUTES.login}?next=${encodeURIComponent(next)}`}
            className="font-semibold text-primary-700 hover:underline"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthCard>
  )
}