// src/pages/auth/LoginPage.tsx — Vanessa Tourisme
import { Link, Navigate, useSearchParams } from 'react-router-dom'

import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'
import { PageLoader } from '@/components/ui/Spinner'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { sanitizeRedirect } from '@/services/auth.service'

export default function LoginPage() {
  useDocumentTitle('Connexion')
  const [params] = useSearchParams()
  const { isAuthenticated, isChecking } = useAuth()

  const next = sanitizeRedirect(params.get('next'))
  const oauthFailed = params.get('error') === 'oauth'

  if (isChecking) return <PageLoader />
  if (isAuthenticated) return <Navigate to={next} replace />

  return (
    <AuthCard
      title="Connexion"
      subtitle="Connectez-vous pour discuter avec Vanessa, réserver et retrouver vos favoris."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link
            to={next === '/' ? ROUTES.register : `${ROUTES.register}?next=${encodeURIComponent(next)}`}
            className="font-semibold text-primary-700 hover:underline"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      {oauthFailed && (
        <p role="alert" className="mb-4 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          La connexion avec Google n’a pas abouti. Veuillez réessayer.
        </p>
      )}
      <LoginForm next={next} />
    </AuthCard>
  )
}