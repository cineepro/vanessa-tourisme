// src/pages/auth/ForgotPasswordPage.tsx — Vanessa Tourisme
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ROUTES } from '@/config/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/appwrite'
import { isValidEmail } from '@/lib/validators'
import { requestPasswordReset } from '@/services/auth.service'

export default function ForgotPasswordPage() {
  useDocumentTitle('Mot de passe oublié')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!isValidEmail(email)) {
      setError('Entrez une adresse email valide.')
      return
    }

    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Entrez votre adresse email : nous vous envoyons un lien pour choisir un nouveau mot de passe."
      footer={
        <Link to={ROUTES.login} className="font-semibold text-primary-700 hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <p role="status" className="rounded-2xl bg-primary-50 p-4 text-sm text-primary-900">
          Si un compte existe avec cette adresse, un lien de réinitialisation vient d’être envoyé.
          Pensez à vérifier vos courriers indésirables.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Adresse email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@email.com"
            leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
            error={error}
            required
          />
          <Button type="submit" size="lg" fullWidth isLoading={loading}>
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthCard>
  )
}