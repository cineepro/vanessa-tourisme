// src/pages/account/ProfilePage.tsx — Vanessa Tourisme
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { LocationConsent } from '@/components/chat/LocationConsent'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  BUDGET_PROFILE_LABELS,
  INTEREST_OPTIONS,
  ROUTES,
  TRAVEL_STYLE_LABELS,
  toOptions,
} from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/appwrite'
import { cn } from '@/lib/cn'
import { getPasswordIssue, normalizePhone } from '@/lib/validators'
import { changePassword } from '@/services/auth.service'
import { toast } from '@/store/ui.store'
import type { BudgetProfile, Language, TouristProfileInput, TravelStyle } from '@/types'

const selectClass =
  'h-12 w-full rounded-2xl border border-sable-300 bg-white px-3 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

const toDateInput = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : '')
const fromDateInput = (value: string): string | null => (value ? `${value}T00:00:00.000Z` : null)
const emptyToNull = (value: string): string | null => (value.trim() ? value.trim() : null)

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-sable-200 bg-white p-5 shadow-card sm:p-6">
      <div>
        <h2 className="font-display text-xl font-bold text-sable-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-sable-600">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export default function ProfilePage() {
  useDocumentTitle('Mon profil')

  const navigate = useNavigate()
  const { user, profile, updateProfile, logout } = useAuth()

  const [nationality, setNationality] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [language, setLanguage] = useState<Language>('fr')
  const [travelStyle, setTravelStyle] = useState<TravelStyle | ''>('')
  const [budget, setBudget] = useState<BudgetProfile | ''>('')
  const [interests, setInterests] = useState<string[]>([])
  const [stayCity, setStayCity] = useState('')
  const [stayStart, setStayStart] = useState('')
  const [stayEnd, setStayEnd] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [healthNotes, setHealthNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Remplit le formulaire quand le profil est chargé
  useEffect(() => {
    if (!profile) return
    setNationality(profile.nationality ?? '')
    setCountry(profile.countryOfResidence ?? '')
    setPhone(profile.phone ?? '')
    setLanguage(profile.preferredLanguage)
    setTravelStyle(profile.travelStyle ?? '')
    setBudget(profile.budgetLevel ?? '')
    setInterests(profile.interests ?? [])
    setStayCity(profile.stayCity ?? '')
    setStayStart(toDateInput(profile.stayStart))
    setStayEnd(toDateInput(profile.stayEnd))
    setEmergencyName(profile.emergencyContactName ?? '')
    setEmergencyPhone(profile.emergencyContactPhone ?? '')
    setHealthNotes(profile.healthNotes ?? '')
  }, [profile?.$id]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleInterest = (interest: string) =>
    setInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    )

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    let normalizedPhone: string | null = null
    if (phone.trim()) {
      normalizedPhone = normalizePhone(phone)
      if (!normalizedPhone) {
        setError('Le numéro de téléphone n’est pas valide.')
        return
      }
    }

    let normalizedEmergency: string | null = null
    if (emergencyPhone.trim()) {
      normalizedEmergency = normalizePhone(emergencyPhone)
      if (!normalizedEmergency) {
        setError('Le numéro du contact d’urgence n’est pas valide.')
        return
      }
    }

    if (stayStart && stayEnd && stayEnd < stayStart) {
      setError('La date de fin du séjour est avant la date de début.')
      return
    }

    const patch: TouristProfileInput = {
      nationality: emptyToNull(nationality),
      countryOfResidence: emptyToNull(country),
      phone: normalizedPhone,
      preferredLanguage: language,
      travelStyle: travelStyle || null,
      budgetLevel: budget || null,
      interests,
      stayCity: emptyToNull(stayCity),
      stayStart: fromDateInput(stayStart),
      stayEnd: fromDateInput(stayEnd),
      emergencyContactName: emptyToNull(emergencyName),
      emergencyContactPhone: normalizedEmergency,
      healthNotes: emptyToNull(healthNotes),
    }

    setSaving(true)
    const ok = await updateProfile(patch)
    setSaving(false)

    if (ok) toast.success('Profil enregistré')
    else setError('Impossible d’enregistrer votre profil. Réessayez.')
  }

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordError(null)

    const issue = getPasswordIssue(newPassword)
    if (issue) {
      setPasswordError(issue)
      return
    }

    setChanging(true)
    try {
      await changePassword(oldPassword, newPassword)
      setOldPassword('')
      setNewPassword('')
      toast.success('Mot de passe modifié', 'Il fonctionne aussi sur Vanessa.')
    } catch (err) {
      setPasswordError(getErrorMessage(err))
    } finally {
      setChanging(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.home)
  }

  if (!user) return null

  return (
    <div className="container-page max-w-3xl space-y-6 py-8 sm:py-12">
      <h1 className="text-3xl font-bold text-sable-900 sm:text-4xl">Mon profil</h1>

      <Section title="Mon compte" description="Ce compte est commun à Vanessa et à Vanessa Tourisme.">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-sable-500">Nom</dt>
            <dd className="mt-1 text-base text-sable-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-sable-500">Email</dt>
            <dd className="mt-1 break-all text-base text-sable-900">{user.email}</dd>
          </div>
        </dl>
        <p className="text-xs text-sable-500">
          Votre nom et votre email se modifient depuis Vanessa, pour rester identiques sur les deux plateformes.
        </p>
      </Section>

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        <Section title="Mon voyage" description="Ces informations aident Vanessa à vous conseiller. Tout est facultatif.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nationalité" value={nationality} onChange={(e) => setNationality(e.target.value)} />
            <Input label="Pays de résidence" value={country} onChange={(e) => setCountry(e.target.value)} />
            <Input
              label="Téléphone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+229 01 23 45 67 89"
            />
            <label className="block text-sm font-medium text-sable-800">
              Langue préférée
              <select className={cn(selectClass, 'mt-1.5')} value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-sable-800">
              Je voyage
              <select
                className={cn(selectClass, 'mt-1.5')}
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value as TravelStyle | '')}
              >
                <option value="">Non précisé</option>
                {toOptions(TRAVEL_STYLE_LABELS).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-sable-800">
              Budget
              <select
                className={cn(selectClass, 'mt-1.5')}
                value={budget}
                onChange={(e) => setBudget(e.target.value as BudgetProfile | '')}
              >
                <option value="">Non précisé</option>
                {toOptions(BUDGET_PROFILE_LABELS).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-sable-800">Centres d’intérêt</legend>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const active = interests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-sable-300 bg-white text-sable-700 hover:bg-sable-100',
                    )}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </Section>

        <Section title="Mon séjour" description="Renseignez-le pour que Vanessa vous accompagne sur place.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Ville du séjour" value={stayCity} onChange={(e) => setStayCity(e.target.value)} />
            <Input label="Arrivée" type="date" value={stayStart} onChange={(e) => setStayStart(e.target.value)} />
            <Input label="Départ" type="date" value={stayEnd} onChange={(e) => setStayEnd(e.target.value)} />
          </div>
        </Section>

        <Section title="Sécurité" description="Visible uniquement par vous. Utile en cas de besoin.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contact d’urgence (nom)"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
            />
            <Input
              label="Contact d’urgence (téléphone)"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
          </div>
          <Textarea
            label="Notes de santé (allergies, traitements…)"
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            maxLength={500}
            showCounter
            rows={3}
          />
        </Section>

        {error && (
          <p role="alert" className="text-sm text-danger-700">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" isLoading={saving}>
          Enregistrer mon profil
        </Button>
      </form>

      <Section title="Position" description="Pour que Vanessa vous trouve la pharmacie ou le restaurant le plus proche.">
        <LocationConsent />
      </Section>

      <Section title="Mot de passe">
        <form onSubmit={handleChangePassword} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Input
            label="Mot de passe actuel"
            type="password"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={passwordError}
          />
          <div className="sm:col-span-2">
            <Button type="submit" variant="outline" isLoading={changing} disabled={!oldPassword || !newPassword}>
              Changer le mot de passe
            </Button>
            <p className="mt-2 text-xs text-sable-500">
              Compte créé avec Google ? Vous n’avez pas de mot de passe ici : utilisez « Mot de passe oublié » pour en définir un.
            </p>
          </div>
        </form>
      </Section>

      <Button variant="ghost" onClick={() => void handleLogout()} leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />}>
        Se déconnecter
      </Button>
    </div>
  )
}