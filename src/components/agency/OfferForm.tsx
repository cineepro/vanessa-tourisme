// src/components/agency/OfferForm.tsx — Vanessa Tourisme
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  CANCELLATION_POLICY_LABELS,
  CURRENCY_LABELS,
  PAYMENT_MODE_LABELS,
  PRICING_TYPE_LABELS,
  SPOKEN_LANGUAGE_LABELS,
  toOptions,
} from '@/config/constants'
import { getErrorMessage } from '@/lib/appwrite'
import { emptyToNull, saveOffer, type OfferInput } from '@/services/admin.service'
import { toast } from '@/store/ui.store'
import type {
  Agency,
  BookingMode,
  CancellationPolicy,
  Currency,
  Guide,
  Offer,
  PaymentMode,
  PricingType,
  Site,
  SpokenLanguage,
} from '@/types'
import {
  CheckboxField,
  ChipMultiSelect,
  FormSection,
  NumberField,
  SelectField,
  TagsInput,
  WeekdaysPicker,
  numberToString,
  parseNumber,
} from './FormFields'
import { ImageUploader } from './ImageUploader'

interface OfferDraft {
  siteId: string
  guideId: string
  title: string
  description: string
  pricingType: PricingType
  price: string
  childPrice: string
  childMaxAge: string
  currency: Currency
  durationMinutes: string
  minParticipants: string
  maxParticipants: string
  languages: SpokenLanguage[]
  includes: string[]
  excludes: string[]
  meetingPoint: string
  meetingLat: string
  meetingLng: string
  bookingMode: BookingMode
  leadTimeHours: string
  closedWeekdays: number[]
  paymentMode: PaymentMode
  depositPercent: string
  instantConfirm: boolean
  cancellationPolicy: CancellationPolicy
  cancellationHours: string
  cover: string[]
  sortOrder: string
  isActive: boolean
}

function toDraft(offer?: Offer | null): OfferDraft {
  return {
    siteId: offer?.siteId ?? '',
    guideId: offer?.guideId ?? '',
    title: offer?.title ?? '',
    description: offer?.description ?? '',
    pricingType: offer?.pricingType ?? 'per_person',
    price: numberToString(offer?.price),
    childPrice: numberToString(offer?.childPrice),
    childMaxAge: numberToString(offer?.childMaxAge ?? 12),
    currency: offer?.currency ?? 'XOF',
    durationMinutes: numberToString(offer?.durationMinutes),
    minParticipants: numberToString(offer?.minParticipants ?? 1),
    maxParticipants: numberToString(offer?.maxParticipants ?? 10),
    languages: offer?.languages ?? ['fr'],
    includes: offer?.includes ?? [],
    excludes: offer?.excludes ?? [],
    meetingPoint: offer?.meetingPoint ?? '',
    meetingLat: numberToString(offer?.meetingLat),
    meetingLng: numberToString(offer?.meetingLng),
    bookingMode: offer?.bookingMode ?? 'any_date',
    leadTimeHours: numberToString(offer?.leadTimeHours ?? 24),
    closedWeekdays: offer?.closedWeekdays ?? [],
    paymentMode: offer?.paymentMode ?? 'on_site',
    depositPercent: numberToString(offer?.depositPercent),
    instantConfirm: offer?.instantConfirm ?? false,
    cancellationPolicy: offer?.cancellationPolicy ?? 'moderate',
    cancellationHours: numberToString(offer?.cancellationHours ?? 48),
    cover: offer?.coverId ? [offer.coverId] : [],
    sortOrder: numberToString(offer?.sortOrder ?? 0),
    isActive: offer?.isActive ?? true,
  }
}

type Errors = Partial<Record<keyof OfferDraft, string>>

const int = (value: string): number => Math.round(parseNumber(value) ?? 0)

interface OfferFormProps {
  agency: Agency
  initial?: Offer | null
  sites: Site[]
  guides: Guide[]
  onSaved: (offer: Offer) => void
  onCancel: () => void
}

export function OfferForm({ agency, initial, sites, guides, onSaved, onCancel }: OfferFormProps) {
  const [draft, setDraft] = useState<OfferDraft>(() => toDraft(initial))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const set = (patch: Partial<OfferDraft>) => setDraft((current) => ({ ...current, ...patch }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const found: Errors = {}
    const price = parseNumber(draft.price)
    const min = parseNumber(draft.minParticipants)
    const max = parseNumber(draft.maxParticipants)
    const child = parseNumber(draft.childPrice)
    const deposit = parseNumber(draft.depositPercent)
    const lead = parseNumber(draft.leadTimeHours)
    const cancelHours = parseNumber(draft.cancellationHours)

    if (!draft.siteId) found.siteId = 'Choisissez le site concerné.'
    if (draft.title.trim().length < 3) found.title = 'Donnez un titre à cette prestation.'
    if (price === null || price < 0) found.price = 'Entrez un prix (en nombre entier).'
    if (draft.childPrice.trim() && (child === null || child < 0)) found.childPrice = 'Prix enfant invalide.'
    if (min === null || min < 1) found.minParticipants = 'Au moins 1.'
    if (max === null || (min !== null && max < min)) found.maxParticipants = 'Doit être supérieur ou égal au minimum.'
    if (lead === null || lead < 0) found.leadTimeHours = 'Entrez un délai en heures (0 si aucun).'
    if (cancelHours === null || cancelHours < 0) found.cancellationHours = 'Entrez un délai en heures.'
    if (draft.paymentMode === 'deposit' && (deposit === null || deposit < 1 || deposit > 100)) {
      found.depositPercent = 'Entrez un pourcentage entre 1 et 100.'
    }

    const hasLat = draft.meetingLat.trim() !== ''
    const hasLng = draft.meetingLng.trim() !== ''
    if (hasLat !== hasLng) found.meetingLat = 'Renseignez la latitude ET la longitude, ou aucune des deux.'

    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError('Certains champs sont à corriger (en rouge ci-dessous).')
      return
    }

    const input: OfferInput = {
      siteId: draft.siteId,
      guideId: draft.guideId || null,
      title: draft.title.trim(),
      description: emptyToNull(draft.description),
      pricingType: draft.pricingType,
      price: int(draft.price),
      childPrice: draft.pricingType === 'per_person' && child !== null ? Math.round(child) : null,
      childMaxAge: int(draft.childMaxAge) || 12,
      currency: draft.currency,
      durationMinutes: parseNumber(draft.durationMinutes) === null ? null : int(draft.durationMinutes),
      minParticipants: int(draft.minParticipants),
      maxParticipants: int(draft.maxParticipants),
      languages: draft.languages,
      includes: draft.includes,
      excludes: draft.excludes,
      meetingPoint: emptyToNull(draft.meetingPoint),
      meetingLat: hasLat ? parseNumber(draft.meetingLat) : null,
      meetingLng: hasLng ? parseNumber(draft.meetingLng) : null,
      bookingMode: draft.bookingMode,
      leadTimeHours: int(draft.leadTimeHours),
      closedWeekdays: draft.closedWeekdays,
      paymentMode: draft.paymentMode,
      depositPercent: draft.paymentMode === 'deposit' ? int(draft.depositPercent) : null,
      instantConfirm: draft.instantConfirm,
      cancellationPolicy: draft.cancellationPolicy,
      cancellationHours: int(draft.cancellationHours),
      coverId: draft.cover[0] ?? null,
      sortOrder: int(draft.sortOrder),
      isActive: draft.isActive,
    }

    setSaving(true)
    try {
      const offer = await saveOffer(agency, input, initial)
      toast.success(initial ? 'Offre mise à jour' : 'Offre créée')
      onSaved(offer)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormSection title="La prestation">
        <SelectField
          label="Site"
          required
          value={draft.siteId}
          onChange={(siteId) => set({ siteId })}
          options={sites.map((site) => ({ value: site.$id, label: `${site.name} (${site.city})` }))}
          placeholder="Choisir un site…"
          error={errors.siteId}
        />
        <SelectField
          label="Guide"
          value={draft.guideId}
          onChange={(guideId) => set({ guideId })}
          options={guides.map((guide) => ({ value: guide.$id, label: guide.fullName }))}
          placeholder="Aucun guide précis"
        />
        <Input label="Titre *" value={draft.title} onChange={(e) => set({ title: e.target.value })} error={errors.title} maxLength={160} placeholder="Visite guidée de 2 heures" />
        <Textarea label="Description" value={draft.description} onChange={(e) => set({ description: e.target.value })} maxLength={3000} showCounter rows={4} />
        <ImageUploader label="Photo (optionnelle)" bucket="sites" value={draft.cover} onChange={(cover) => set({ cover })} max={1} />
      </FormSection>

      <FormSection title="Tarif">
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Tarif"
            value={draft.pricingType}
            onChange={(value) => value && set({ pricingType: value })}
            options={toOptions(PRICING_TYPE_LABELS)}
          />
          <NumberField label="Prix *" value={draft.price} onChange={(price) => set({ price })} min={0} error={errors.price} />
          <SelectField
            label="Devise"
            value={draft.currency}
            onChange={(value) => value && set({ currency: value })}
            options={toOptions(CURRENCY_LABELS)}
          />
        </div>

        {draft.pricingType === 'per_person' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Prix enfant" value={draft.childPrice} onChange={(childPrice) => set({ childPrice })} min={0} hint="Laissez vide pour appliquer le prix adulte." error={errors.childPrice} />
            <NumberField label="Âge maximum enfant" value={draft.childMaxAge} onChange={(childMaxAge) => set({ childMaxAge })} min={0} max={17} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField label="Durée (minutes)" value={draft.durationMinutes} onChange={(durationMinutes) => set({ durationMinutes })} min={0} />
          <NumberField label="Participants min." value={draft.minParticipants} onChange={(minParticipants) => set({ minParticipants })} min={1} error={errors.minParticipants} />
          <NumberField label="Participants max." value={draft.maxParticipants} onChange={(maxParticipants) => set({ maxParticipants })} min={1} error={errors.maxParticipants} />
        </div>
      </FormSection>

      <FormSection title="Contenu">
        <ChipMultiSelect<SpokenLanguage>
          label="Langues de la visite"
          options={toOptions(SPOKEN_LANGUAGE_LABELS)}
          value={draft.languages}
          onChange={(languages) => set({ languages })}
        />
        <TagsInput label="Inclus" value={draft.includes} onChange={(includes) => set({ includes })} placeholder="Guide, eau, entrée…" />
        <TagsInput label="Non inclus" value={draft.excludes} onChange={(excludes) => set({ excludes })} placeholder="Repas, transport…" />
        <Input label="Point de rendez-vous" value={draft.meetingPoint} onChange={(e) => set({ meetingPoint: e.target.value })} maxLength={255} />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Latitude du rendez-vous" step="any" value={draft.meetingLat} onChange={(meetingLat) => set({ meetingLat })} error={errors.meetingLat} />
          <NumberField label="Longitude du rendez-vous" step="any" value={draft.meetingLng} onChange={(meetingLng) => set({ meetingLng })} />
        </div>
      </FormSection>

      <FormSection title="Réservation">
        <SelectField
          label="Mode de réservation"
          value={draft.bookingMode}
          onChange={(value) => value && set({ bookingMode: value })}
          options={[
            { value: 'any_date', label: 'Toute date (le touriste choisit librement)' },
            { value: 'slots', label: 'Créneaux (dates et horaires que vous ouvrez)' },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Délai minimum avant la visite (heures)" value={draft.leadTimeHours} onChange={(leadTimeHours) => set({ leadTimeHours })} min={0} error={errors.leadTimeHours} />
          <div className="self-end">
            <CheckboxField label="Confirmation immédiate" checked={draft.instantConfirm} onChange={(instantConfirm) => set({ instantConfirm })} hint="Sinon, vous confirmez chaque demande." />
          </div>
        </div>
        <WeekdaysPicker
          label="Jours fermés"
          value={draft.closedWeekdays}
          onChange={(closedWeekdays) => set({ closedWeekdays })}
          hint="Les jours sélectionnés ne seront pas réservables."
        />
      </FormSection>

      <FormSection title="Paiement et annulation">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Mode de paiement"
            value={draft.paymentMode}
            onChange={(value) => value && set({ paymentMode: value })}
            options={toOptions(PAYMENT_MODE_LABELS)}
          />
          {draft.paymentMode === 'deposit' && (
            <NumberField label="Acompte (%)" value={draft.depositPercent} onChange={(depositPercent) => set({ depositPercent })} min={1} max={100} error={errors.depositPercent} />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Politique d’annulation"
            value={draft.cancellationPolicy}
            onChange={(value) => value && set({ cancellationPolicy: value })}
            options={(Object.keys(CANCELLATION_POLICY_LABELS) as CancellationPolicy[]).map((key) => ({
              value: key,
              label: CANCELLATION_POLICY_LABELS[key].label,
            }))}
          />
          <NumberField label="Délai d’annulation (heures)" value={draft.cancellationHours} onChange={(cancellationHours) => set({ cancellationHours })} min={0} error={errors.cancellationHours} />
        </div>
      </FormSection>

      <FormSection title="Affichage">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Ordre d’affichage" value={draft.sortOrder} onChange={(sortOrder) => set({ sortOrder })} hint="Les petits nombres s’affichent en premier." />
          <div className="self-end">
            <CheckboxField label="Offre active (réservable)" checked={draft.isActive} onChange={(isActive) => set({ isActive })} />
          </div>
        </div>
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
          {initial ? 'Enregistrer' : 'Créer l’offre'}
        </Button>
      </div>
    </form>
  )
}