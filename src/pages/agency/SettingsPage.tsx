// src/pages/agency/SettingsPage.tsx — Vanessa Tourisme
import { useEffect, useState, type FormEvent } from 'react'

import { AdminHeader } from '@/components/agency/AdminHeader'
import { FormSection } from '@/components/agency/FormFields'
import { ImageUploader } from '@/components/agency/ImageUploader'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { CURRENCY_LABELS } from '@/config/constants'
import { getErrorMessage } from '@/lib/appwrite'
import { formatDate } from '@/lib/format'
import { isValidEmail, normalizePhone } from '@/lib/validators'
import { emptyToNull, updateAgencySettings } from '@/services/admin.service'
import { toast } from '@/store/ui.store'
import type { LicenseStatus } from '@/types'
import { useAgency } from './AgencyContext'

const LICENSE: Record<LicenseStatus, { label: string; tone: BadgeTone }> = {
  trial: { label: 'Période d’essai', tone: 'accent' },
  active: { label: 'Active', tone: 'primary' },
  suspended: { label: 'Suspendue', tone: 'danger' },
  expired: { label: 'Expirée', tone: 'danger' },
}

const HEX = /^#[0-9a-fA-F]{6}$/

export default function SettingsPage() {
  const { agency, canManage, refresh } = useAgency()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [color, setColor] = useState('#008751')
  const [logo, setLogo] = useState<string[]>([])
  const [cover, setCover] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(agency.name)
    setDescription(agency.description ?? '')
    setPhone(agency.phone ?? '')
    setWhatsapp(agency.whatsapp ?? '')
    setEmail(agency.email ?? '')
    setWebsite(agency.website ?? '')
    setAddress(agency.address ?? '')
    setCity(agency.city ?? '')
    setColor(agency.primaryColor || '#008751')
    setLogo(agency.logoId ? [agency.logoId] : [])
    setCover(agency.coverId ? [agency.coverId] : [])
  }, [agency.$id, agency.$updatedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (name.trim().length < 2) return setError('Entrez le nom de l’agence.')
    if (phone.trim() && !normalizePhone(phone)) return setError('Le numéro de téléphone n’est pas valide.')
    if (whatsapp.trim() && !normalizePhone(whatsapp)) return setError('Le numéro WhatsApp n’est pas valide.')
    if (email.trim() && !isValidEmail(email)) return setError('L’adresse email n’est pas valide.')
    if (!HEX.test(color)) return setError('La couleur doit être au format #RRGGBB.')
    if (website.trim()) {
      try {
        new URL(website.trim())
      } catch {
        return setError('Le site web doit commencer par https://')
      }
    }

    setSaving(true)
    try {
      await updateAgencySettings(agency.$id, {
        name: name.trim(),
        description: emptyToNull(description),
        phone: phone.trim() ? normalizePhone(phone) : null,
        whatsapp: whatsapp.trim() ? normalizePhone(whatsapp) : null,
        email: emptyToNull(email),
        website: emptyToNull(website),
        address: emptyToNull(address),
        city: emptyToNull(city),
        primaryColor: color,
        logoId: logo[0] ?? null,
        coverId: cover[0] ?? null,
      })
      toast.success('Paramètres enregistrés')
      refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const license = LICENSE[agency.licenseStatus]

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Paramètres de l’agence"
        description={canManage ? 'Les informations affichées aux touristes.' : 'Seuls les propriétaires et administrateurs peuvent modifier ces informations.'}
      />

      <FormSection title="Licence">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-sable-500">Statut</dt>
            <dd className="mt-1">
              <Badge tone={license.tone}>{license.label}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-sable-500">Début</dt>
            <dd className="mt-1 text-sable-900">{formatDate(agency.licenseStartsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-sable-500">Fin</dt>
            <dd className="mt-1 text-sable-900">{formatDate(agency.licenseEndsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-sable-500">Devise</dt>
            <dd className="mt-1 text-sable-900">{CURRENCY_LABELS[agency.currency]}</dd>
          </div>
        </dl>
        <p className="text-xs text-sable-500">
          La licence, la commission et la devise sont définies avec ASILLIA dans l’accord de collaboration.
        </p>
      </FormSection>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <fieldset disabled={!canManage} className="space-y-5 disabled:opacity-70">
          <FormSection title="Présentation">
            <Input label="Nom de l’agence *" value={name} onChange={(e) => setName(e.target.value)} maxLength={128} />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} showCounter rows={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploader label="Logo" bucket="agencies" value={logo} onChange={setLogo} max={1} />
              <ImageUploader label="Bannière" bucket="agencies" value={cover} onChange={setCover} max={1} />
            </div>
            <div>
              <label htmlFor="agency-color" className="mb-1.5 block text-sm font-medium text-sable-800">
                Couleur principale
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="agency-color"
                  type="color"
                  value={HEX.test(color) ? color : '#008751'}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-12 w-14 cursor-pointer rounded-xl border border-sable-300 bg-white p-1"
                />
                <Input aria-label="Code couleur" value={color} onChange={(e) => setColor(e.target.value)} maxLength={7} className="max-w-[9rem] font-mono" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Coordonnées">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Téléphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="WhatsApp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Site web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
              <Input label="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={255} />
              <Input label="Ville" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
            </div>
          </FormSection>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </p>
        )}

        {canManage && (
          <Button type="submit" size="lg" isLoading={saving}>
            Enregistrer
          </Button>
        )}
      </form>
    </div>
  )
}