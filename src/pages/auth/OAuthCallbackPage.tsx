// src/pages/auth/OAuthCallbackPage.tsx — Vanessa Tourisme
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { AuthCard } from '@/components/auth/AuthCard'
import { buttonClasses } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { consumeAuthRedirect } from '@/services/auth.service'

/** Retour de Google : /oauth-callback?userId=...&secret=... -> création de la session sur ce site. */
export default function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { completeOAuth, error } = useAuth()
  const [failed, setFailed] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    // Le secret est à usage unique : on ne l'utilise qu'une fois (même en mode strict)
    if (startedRef.current) return
    startedRef.current = true

    const userId = params.get('userId')
    const secret = params.get('secret')

    if (!userId || !secret) {
      setFailed(true)
      return
    }

    void completeOAuth(userId, secret).then((ok) => {
      if (ok) navigate(consumeAuthRedirect(), { replace: true })
      else setFailed(true)
    })
  }, [params, completeOAuth, navigate])

  if (failed) {
    return (
      <AuthCard title="Connexion impossible">
        <p role="alert" className="text-sable-700">
          {error ?? 'La connexion avec Google a échoué. Veuillez réessayer.'}
        </p>
        <Link to={ROUTES.login} className={buttonClasses({ size: 'lg', fullWidth: true, className: 'mt-6' })}>
          Retour à la connexion
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Connexion en cours…">
      <div className="flex flex-col items-center py-4">
        <Spinner className="h-8 w-8" />
        <p className="mt-4 text-sm text-sable-600">Nous finalisons votre connexion avec Google.</p>
      </div>
    </AuthCard>
  )
}