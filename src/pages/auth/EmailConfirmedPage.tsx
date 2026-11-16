// src/pages/auth/EmailConfirmedPage.tsx — Vanessa Tourisme
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck, CircleX } from 'lucide-react'

import { AuthCard } from '@/components/auth/AuthCard'
import { buttonClasses } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ROUTES } from '@/config/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/appwrite'
import { clearPendingVerification, confirmVerification } from '@/services/auth.service'

type State = 'loading' | 'success' | 'error'

/** Page ouverte par le lien reçu par email : /email-confirmed?userId=...&secret=... */
export default function EmailConfirmedPage() {
  useDocumentTitle('Email confirmé')

  const [params] = useSearchParams()
  const [state, setState] = useState<State>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    // Le lien est à usage unique : on ne le valide qu'une fois (même en mode strict)
    if (startedRef.current) return
    startedRef.current = true

    const userId = params.get('userId')
    const secret = params.get('secret')

    if (!userId || !secret) {
      setState('error')
      setMessage('Ce lien de confirmation est incomplet.')
      return
    }

    confirmVerification(userId, secret)
      .then(() => {
        clearPendingVerification()
        setState('success')
      })
      .catch((error: unknown) => {
        setState('error')
        setMessage(getErrorMessage(error))
      })
  }, [params])

  return (
    <AuthCard title={state === 'success' ? 'Email confirmé !' : 'Confirmation de votre email'}>
      <div className="flex flex-col items-center text-center">
        {state === 'loading' && (
          <>
            <Spinner className="h-8 w-8" />
            <p className="mt-4 text-sable-600">Validation en cours…</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CircleCheck className="h-14 w-14 text-primary-600" aria-hidden="true" />
            <p className="mt-4 text-sable-700">
              Votre compte est activé. Vous pouvez maintenant vous connecter, ici comme sur Vanessa.
            </p>
            <Link to={ROUTES.login} className={buttonClasses({ size: 'lg', fullWidth: true, className: 'mt-6' })}>
              Me connecter
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <CircleX className="h-14 w-14 text-danger-600" aria-hidden="true" />
            <p role="alert" className="mt-4 text-sable-700">
              {message ?? 'Ce lien n’est plus valide.'}
            </p>
            <p className="mt-2 text-sm text-sable-500">
              Il a peut-être expiré ou déjà été utilisé. Si votre compte est déjà actif, connectez-vous
              simplement.
            </p>
            <Link
              to={ROUTES.login}
              className={buttonClasses({ variant: 'outline', size: 'lg', fullWidth: true, className: 'mt-6' })}
            >
              Aller à la connexion
            </Link>
          </>
        )}
      </div>
    </AuthCard>
  )
}