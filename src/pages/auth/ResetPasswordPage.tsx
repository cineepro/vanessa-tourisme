// src/pages/auth/ResetPasswordPage.tsx — Vanessa Tourisme
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck, Lock } from 'lucide-react'

import { AuthCard } from '@/components/auth/AuthCard'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/config/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/appwrite'
import { getPasswordIssue } from '@/lib/validators'
import { confirmPasswordReset } from '@/services/auth.service'

/** Page ouverte par le lien de réinitialisation : /reset-password?userId=...&secret=... */
export default function ResetPasswordPage() {
  useDocumentTitle('Nouveau mot de passe')

  const [params] = useSearchParams()
  const userId = params.get('userId')
  const secret = params.get('secret')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const issue = getPasswordIssue(password)
    if (issue) {
      setError(issue)
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne sont pas identiques.')
      return
    }
    if (!userId || !secret) return

    setLoading(true)
    try {
      await confirmPasswordReset(userId, secret, password)
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (!userId || !secret) {
    return (
      <AuthCard title="Lien invalide">
        <p role="alert" className="text-sable-700">
          Ce lien de réinitialisation est incomplet ou a expiré.
        </p>
        <Link
          to={ROUTES.forgotPassword}
          className={buttonClasses({ size: 'lg', fullWidth: true, className: 'mt-6' })}
        >
          Demander un nouveau lien
        </Link>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard title="Mot de passe modifié">
        <div className="flex flex-col items-center text-center">
          <CircleCheck className="h-14 w-14 text-primary-600" aria-hidden="true" />
          <p className="mt-4 text-sable-700">
            Votre nouveau mot de passe est enregistré. Il fonctionne aussi sur Vanessa.
          </p>
          <Link to={ROUTES.login} className={buttonClasses({ size: 'lg', fullWidth: true, className: 'mt-6' })}>
            Me connecter
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Nouveau mot de passe" subtitle="Choisissez un mot de passe d’au moins 8 caractères.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          required
        />
        <Input
          label="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          error={error}
          required
        />
        <Button type="submit" size="lg" fullWidth isLoading={loading}>
          Enregistrer
        </Button>
      </form>
    </AuthCard>
  )
}