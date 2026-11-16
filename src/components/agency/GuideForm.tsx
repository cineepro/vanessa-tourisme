// src/components/agency/GuideForm.tsx — Vanessa Tourisme
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SPOKEN_LANGUAGE_LABELS, toOptions } from '@/config/constants'
import { getErrorMessage } from '@/lib/appwrite'
import { isValidEmail, normalizePhone } from '@/lib/validators'
import { emptyToNull, saveGuide, type GuideInput } from '@/services/admin.service'
import { toast } from '@/store/ui.store'
import type { Agency, Guide, GuideStatus, Site, SpokenLanguage } from '@/types'
import {
  CheckboxField,
  ChipMultiSelect,
  FormSection,
  NumberField,
  SelectField,
  TagsInput,
  numberToString,
  parseNumber,
} from './FormFields'
import { ImageUploader } from './ImageUploader'

interface GuideDraft {
  fullName: string
  bio: string
  photo: string[]
  phone: string
  whatsapp: string
  email: string
  languages: SpokenLanguage[]
  specialties: string[]
  siteIds: string[]
  yearsExperience: string
  certified: boolean
  licenseNumber: string
  baseCity: string
  status: GuideStatus
}

function toDraft(guide?: Guide | null): GuideDraft {
  return {
    fullName: guide?.fullName ?? '',
    bio: guide?.bio ?? '',
    photo: guide?.photoId ? [guide.photoId] : [],
    phone: guide?.phone ?? '',
    whatsapp: guide?.whatsapp ?? '',
    email: guide?.email ?? '',
    languages: guide?.languages ?? ['fr'],
    specialties: guide?.specialties ?? [],
    siteIds: guide?.siteIds ?? [],
    yearsExperience: numberToString(guide?.yearsExperience),
    certified: guide?.certified ?? false,
    licenseNumber: guide?.licenseNumber ?? '',
    baseCity: guide?.baseCity ?? '',
    status: guide?.status ?? 'active',
  }
}

type Errors = Partial<Record<keyof GuideDraft, string>>

interface GuideFormProps {
  agency: Agency
  initial?: Guide | null
  /** Sites que le guide peut couvrir */
  sites: Site[]
  onSaved: (guide: Guide) => void
  onCancel: () => void
}

export function GuideForm({ agency, initial, sites, onSaved, onCancel }: GuideFormProps) {
  const [draft, setDraft] = useState<GuideDraft>(() => toDraft(initial))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const set = (patch: Partial<GuideDraft>) => setDraft((current) => ({ ...current, ...patch }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const found: Errors = {}
    if (draft.fullName.trim().length < 2) found.fullName = 'Entrez le nom du guide.'
    if (draft.languages.length === 0) found.languages = 'Choisissez au moins une langue.'
    if (draft.phone.trim() && !normalizePhone(draft.phone)) found.phone = 'Numéro invalide.'
    if (draft.whatsapp.trim() && !normalizePhone(draft.whatsapp)) found.whatsapp = 'Numéro invalide.'
    if (draft.email.trim() && !isValidEmail(draft.email)) found.email = 'Adresse email invalide.'
    const years = parseNumber(draft.yearsExperience)
    if (draft.yearsExperience.trim() && (years === null || years < 0)) {
      found.yearsExperience = 'Entrez un nombre d’années.'
    }

    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError('Certains champs sont à corriger (en rouge ci-dessous).')
      return
    }

    const input: GuideInput = {
      fullName: draft.fullName.trim(),
      bio: emptyToNull(draft.bio),
      photoId: draft.photo[0] ?? null,
      phone: draft.phone.trim() ? normalizePhone(draft.phone) : null,
      whatsapp: draft.whatsapp.trim() ? normalizePhone(draft.whatsapp) : null,
      email: emptyToNull(draft.email),
      languages: draft.languages,
      specialties: draft.specialties,
      siteIds: draft.siteIds,
      yearsExperience: years === null ? null : Math.round(years),
      certified: draft.certified,
      licenseNumber: emptyToNull(draft.licenseNumber),
      baseCity: emptyToNull(draft.baseCity),
      status: draft.status,
    }

    setSaving(true)
    try {
      const guide = await saveGuide(agency, input, initial)
      toast.success(initial ? 'Guide mis à jour' : 'Guide ajouté')
      onSaved(guide)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormSection title="Identité">
        <Input label="Nom complet *" value={draft.fullName} onChange={(e) => set({ fullName: e.target.value })} error={errors.fullName} maxLength={128} />
        <ImageUploader label="Photo" bucket="guides" value={draft.photo} onChange={(photo) => set({ photo })} max={1} />
        <Textarea label="Présentation" value={draft.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={3000} showCounter rows={5} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Ville de base" value={draft.baseCity} onChange={(e) => set({ baseCity: e.target.value })} maxLength={100} />
          <NumberField label="Années d’expérience" value={draft.yearsExperience} onChange={(yearsExperience) => set({ yearsExperience })} min={0} error={errors.yearsExperience} />
        </div>
      </FormSection>

      <FormSection title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Téléphone" type="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} error={errors.phone} />
          <Input label="WhatsApp" type="tel" value={draft.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} error={errors.whatsapp} />
        </div>
        <Input label="Email" type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} error={errors.email} />
      </FormSection>

      <FormSection title="Compétences">
        <ChipMultiSelect<SpokenLanguage>
          label="Langues parlées"
          required
          options={toOptions(SPOKEN_LANGUAGE_LABELS)}
          value={draft.languages}
          onChange={(languages) => set({ languages })}
          error={errors.languages}
        />
        <TagsInput label="Spécialités" value={draft.specialties} onChange={(specialties) => set({ specialties })} placeholder="histoire, vodun, nature…" maxLength={64} />
        <ChipMultiSelect<string>
          label="Sites couverts"
          options={sites.map((site) => ({ value: site.$id, label: site.name }))}
          value={draft.siteIds}
          onChange={(siteIds) => set({ siteIds })}
          hint={sites.length === 0 ? 'Créez d’abord des sites pour pouvoir les associer.' : undefined}
        />
      </FormSection>

      <FormSection title="Agrément et statut">
        <div className="grid gap-4 sm:grid-cols-2">
          <CheckboxField label="Guide agréé" checked={draft.certified} onChange={(certified) => set({ certified })} />
          <Input label="N° d’agrément" value={draft.licenseNumber} onChange={(e) => set({ licenseNumber: e.target.value })} maxLength={64} />
        </div>
        <SelectField
          label="Statut"
          value={draft.status}
          onChange={(value) => value && set({ status: value })}
          options={[
            { value: 'active', label: 'Actif (visible)' },
            { value: 'pending', label: 'En attente (non visible)' },
            { value: 'inactive', label: 'Inactif (non visible)' },
          ]}
        />
      </FormSection>

      {formError && (
        <p role="alert" className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {formError}
        </p>
      )}

      <div className="sticky bottom-0 -mx-1 flex justify-end gap-3 border-t border-sable-200 bg-white/95 px-1 py-3 backdrop-blur">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button type="submit" isLoading={saving}>
          {initial ? 'Enregistrer' : 'Ajouter le guide'}
        </Button>
      </div>
    </form>
  )
}