// src/components/auth/LoginForm.tsx — Vanessa Tourisme
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleX, Lock, Mail } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { isValidEmail } from '@/lib/validators'
import { GoogleButton } from './GoogleButton'

interface LoginFormProps {
  /** Connexion réussie */
  onSuccess?: () => void
  /** Avant de quitter vers une autre page (ferme la modale) */
  onNavigate?: () => void
  /** Page à ouvrir après une connexion Google */
  next?: string
}

export function LoginForm({ onSuccess, onNavigate, next = '/' }: LoginFormProps) {
  const { loginWithEmail, isBusy, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    clearError()
    return clearError
  }, [clearError])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)

    if (!isValidEmail(email)) {
      setLocalError('Entrez une adresse email valide.')
      return
    }

    const result = await loginWithEmail(email, password)

    if (result === 'ok') {
      onSuccess?.()
    } else if (result === 'unverified') {
      onNavigate?.()
      navigate(ROUTES.verifyEmail)
    }
  }

  const shownError = localError ?? error

  return (
    <div className="space-y-5">
      <GoogleButton next={next} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-sable-200" />
        <span className="text-sm text-sable-500">ou avec votre email</span>
        <div className="h-px flex-1 bg-sable-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Adresse email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="vous@email.com"
          leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
          required
        />

        <div>
          <Input
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
            required
          />
          <div className="mt-2 flex justify-end">
            <Link
              to={ROUTES.forgotPassword}
              onClick={onNavigate}
              className="text-sm font-medium text-primary-700 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        {shownError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{shownError}</span>
          </div>
        )}

        <Button type="submit" size="lg" fullWidth isLoading={isBusy}>
          Se connecter
        </Button>
      </form>

      <p className="text-center text-xs text-sable-500">
        Votre compte Vanessa fonctionne ici avec les mêmes identifiants.
      </p>
    </div>
  )
}