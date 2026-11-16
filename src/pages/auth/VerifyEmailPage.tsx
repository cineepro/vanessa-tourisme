// src/pages/auth/VerifyEmailPage.tsx — Vanessa Tourisme
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'

import { AuthCard } from '@/components/auth/AuthCard'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/config/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/appwrite'
import { getPendingVerificationEmail, resendVerificationEmail } from '@/services/auth.service'

const COOLDOWN_SECONDS = 60

export default function VerifyEmailPage() {
  useDocumentTitle('Vérifiez votre email')

  const email = getPendingVerificationEmail()
  const [showResend, setShowResend] = useState(false)
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = async (event: FormEvent) => {
    event.preventDefault()
    if (!email || cooldown > 0) return

    setSending(true)
    setError(null)
    try {
      await resendVerificationEmail(email, password)
      setSent(true)
      setPassword('')
      setCooldown(COOLDOWN_SECONDS)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthCard title="Vérifiez votre boîte mail">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          <MailCheck className="h-8 w-8" aria-hidden="true" />
        </span>

        <p className="mt-5 text-sable-700">
          Nous avons envoyé un lien de confirmation
          {email ? (
            <>
              {' '}à <strong className="text-sable-900">{email}</strong>
            </>
          ) : null}
          . Cliquez dessus pour activer votre compte, puis connectez-vous.
        </p>
        <p className="mt-2 text-sm text-sable-500">
          Pensez à regarder dans vos courriers indésirables.
        </p>

        <Link to={ROUTES.login} className={buttonClasses({ size: 'lg', fullWidth: true, className: 'mt-6' })}>
          J’ai confirmé, me connecter
        </Link>

        {email && !showResend && (
          <button
            type="button"
            onClick={() => setShowResend(true)}
            className="mt-4 text-sm font-semibold text-primary-700 hover:underline"
          >
            Je n’ai rien reçu
          </button>
        )}

        {email && showResend && (
          <form onSubmit={handleResend} className="mt-5 w-full space-y-3 text-left">
            <Input
              label="Votre mot de passe"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              hint="Nécessaire pour renvoyer le lien en toute sécurité."
              required
            />
            {error && (
              <p role="alert" className="text-sm text-danger-700">
                {error}
              </p>
            )}
            {sent && (
              <p role="status" className="text-sm text-primary-700">
                Lien renvoyé. Vérifiez votre boîte mail.
              </p>
            )}
            <Button type="submit" variant="outline" fullWidth isLoading={sending} disabled={cooldown > 0}>
              {cooldown > 0 ? `Renvoyer dans ${cooldown} s` : 'Renvoyer le lien'}
            </Button>
          </form>
        )}
      </div>
    </AuthCard>
  )
}