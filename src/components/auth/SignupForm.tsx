// src/components/auth/SignupForm.tsx — Vanessa Tourisme
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleX, Lock, Mail, Phone, User } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { getPasswordIssue, isValidEmail, normalizePhone } from '@/lib/validators'
import { GoogleButton } from './GoogleButton'

interface SignupFormProps {
  /** Avant de quitter vers la page de vérification (ferme la modale) */
  onNavigate?: () => void
  /** Page à ouvrir après une inscription via Google */
  next?: string
}

export function SignupForm({ onNavigate, next = '/' }: SignupFormProps) {
  const { signUpWithEmail, isBusy, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    clearError()
    return clearError
  }, [clearError])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)

    if (!acceptedPrivacy) return

    if (name.trim().length < 2) {
      setLocalError('Entrez votre nom complet.')
      return
    }
    if (!isValidEmail(email)) {
      setLocalError('Le format de l’adresse email n’est pas valide.')
      return
    }

    let normalizedPhone: string | undefined
    if (phone.trim()) {
      const result = normalizePhone(phone)
      if (!result) {
        setLocalError('Le numéro de téléphone saisi n’est pas valide.')
        return
      }
      normalizedPhone = result
    }

    const passwordIssue = getPasswordIssue(password)
    if (passwordIssue) {
      setLocalError(passwordIssue)
      return
    }

    const result = await signUpWithEmail({ name, email, password, phone: normalizedPhone })

    if (result === 'verify') {
      onNavigate?.()
      navigate(ROUTES.verifyEmail)
    }
  }

  const shownError = localError ?? error

  return (
    <div className="space-y-5">
      <GoogleButton label="S’inscrire avec Google" next={next} />
      <p className="-mt-2 text-center text-xs text-sable-500">
        Aucun email de confirmation à surveiller, Google s’en charge.
      </p>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-sable-200" />
        <span className="text-sm text-sable-500">ou avec votre email</span>
        <div className="h-px flex-1 bg-sable-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Nom complet"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Jean Dupont"
          leftIcon={<User className="h-4 w-4" aria-hidden="true" />}
          required
        />
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
        <Input
          label="Téléphone (optionnel)"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+229 01 23 45 67 89"
          hint="Pas obligatoire, mais utile pour vous joindre au sujet d’une réservation."
          leftIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
        />
        <Input
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 caractères"
          minLength={8}
          leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />}
          required
        />

        <label
          htmlFor="accept-privacy"
          className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sable-100 p-4 text-sm leading-relaxed text-sable-700"
        >
          <input
            id="accept-privacy"
            type="checkbox"
            checked={acceptedPrivacy}
            onChange={(event) => setAcceptedPrivacy(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary-600"
            required
          />
          <span>
            J’ai lu et j’accepte la{' '}
            <Link
              to={ROUTES.privacy}
              target="_blank"
              className="font-semibold text-primary-700 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              politique de confidentialité
            </Link>{' '}
            et les{' '}
            <Link
              to={ROUTES.terms}
              target="_blank"
              className="font-semibold text-primary-700 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              conditions d’utilisation
            </Link>
            . Je comprends que mon email sera vérifié avant l’activation du compte.
          </span>
        </label>

        {shownError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{shownError}</span>
          </div>
        )}

        <Button type="submit" size="lg" fullWidth isLoading={isBusy} disabled={!acceptedPrivacy}>
          Créer mon compte
        </Button>

        {!acceptedPrivacy && (
          <p className="text-center text-xs text-sable-500">
            Acceptez la politique de confidentialité pour continuer.
          </p>
        )}
      </form>
    </div>
  )
}