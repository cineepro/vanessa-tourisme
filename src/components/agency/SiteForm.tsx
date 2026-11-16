// src/components/agency/SiteForm.tsx — Vanessa Tourisme
import { useState, type FormEvent } from 'react'
import { LocateFixed } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  CLIMATE_LABELS,
  DEPARTMENTS,
  DIFFICULTY_LABELS,
  ENVIRONMENT_LABELS,
  SITE_BUDGET_LABELS,
  SITE_CATEGORY_LABELS,
  VIBE_LABELS,
  toOptions,
} from '@/config/constants'
import { getErrorMessage } from '@/lib/appwrite'
import { geolocationErrorMessage, getCurrentPosition, isInBenin, isValidCoordinate } from '@/lib/geo'
import { emptyToNull, saveSite, type SiteInput } from '@/services/admin.service'
import { toast } from '@/store/ui.store'
import type {
  Agency,
  BudgetLevel,
  ClimateFeel,
  Department,
  Difficulty,
  Environment,
  PublishStatus,
  Site,
  SiteCategory,
  Vibe,
} from '@/types'
import {
  CheckboxField,
  ChipMultiSelect,
  FormSection,
  MonthsPicker,
  NumberField,
  SelectField,
  TagsInput,
  numberToString,
  parseNumber,
} from './FormFields'
import { ImageUploader } from './ImageUploader'

interface SiteDraft {
  name: string
  tagline: string
  summary: string
  description: string
  history: string
  department: Department | ''
  city: string
  address: string
  latitude: string
  longitude: string
  categories: SiteCategory[]
  vibes: Vibe[]
  environments: Environment[]
  climateFeel: ClimateFeel | ''
  activities: string[]
  highlights: string[]
  bestMonths: number[]
  bestSeasonNote: string
  avgVisitMinutes: string
  difficulty: Difficulty
  budgetLevel: BudgetLevel | ''
  entranceFee: string
  familyFriendly: boolean
  accessibleMobility: boolean
  practicalInfo: string
  openingHours: string
  cover: string[]
  gallery: string[]
  videoUrl: string
  aiContext: string
  status: PublishStatus
  featured: boolean
}

function toDraft(site?: Site | null): SiteDraft {
  return {
    name: site?.name ?? '',
    tagline: site?.tagline ?? '',
    summary: site?.summary ?? '',
    description: site?.description ?? '',
    history: site?.history ?? '',
    department: site?.department ?? '',
    city: site?.city ?? '',
    address: site?.address ?? '',
    latitude: numberToString(site?.latitude),
    longitude: numberToString(site?.longitude),
    categories: site?.categories ?? [],
    vibes: site?.vibes ?? [],
    environments: site?.environments ?? [],
    climateFeel: site?.climateFeel ?? '',
    activities: site?.activities ?? [],
    highlights: site?.highlights ?? [],
    bestMonths: site?.bestMonths ?? [],
    bestSeasonNote: site?.bestSeasonNote ?? '',
    avgVisitMinutes: numberToString(site?.avgVisitMinutes),
    difficulty: site?.difficulty ?? 'facile',
    budgetLevel: site?.budgetLevel ?? '',
    entranceFee: numberToString(site?.entranceFee ?? 0),
    familyFriendly: site?.familyFriendly ?? false,
    accessibleMobility: site?.accessibleMobility ?? false,
    practicalInfo: site?.practicalInfo ?? '',
    openingHours: site?.openingHours ?? '',
    cover: site?.coverId ? [site.coverId] : [],
    gallery: site?.gallery ?? [],
    videoUrl: site?.videoUrl ?? '',
    aiContext: site?.aiContext ?? '',
    status: site?.status ?? 'draft',
    featured: site?.featured ?? false,
  }
}

type Errors = Partial<Record<keyof SiteDraft, string>>

function validate(draft: SiteDraft): Errors {
  const errors: Errors = {}

  if (draft.name.trim().length < 2) errors.name = 'Entrez le nom du site.'
  if (draft.summary.trim().length < 10) errors.summary = 'Résumez le site en une ou deux phrases (10 caractères minimum).'
  if (draft.description.trim().length < 30) errors.description = 'La description est trop courte (30 caractères minimum).'
  if (!draft.department) errors.department = 'Choisissez le département.'
  if (!draft.city.trim()) errors.city = 'Entrez la ville.'
  if (draft.categories.length === 0) errors.categories = 'Choisissez au moins un type de site.'

  const lat = parseNumber(draft.latitude)
  const lng = parseNumber(draft.longitude)
  if (lat === null || lng === null || !isValidCoordinate(lat, lng)) {
    errors.latitude = 'Entrez des coordonnées valides.'
  } else if (!isInBenin({ lat, lng })) {
    errors.latitude = 'Ces coordonnées ne sont pas au Bénin (latitude entre 6 et 12, longitude entre 1 et 4). Latitude et longitude sont-elles inversées ?'
  }

  const duration = parseNumber(draft.avgVisitMinutes)
  if (draft.avgVisitMinutes.trim() && (duration === null || duration < 0)) {
    errors.avgVisitMinutes = 'Entrez une durée en minutes.'
  }

  const fee = parseNumber(draft.entranceFee)
  if (fee === null || fee < 0) errors.entranceFee = 'Entrez un montant (0 si l’entrée est libre).'

  if (draft.videoUrl.trim()) {
    try {
      new URL(draft.videoUrl.trim())
    } catch {
      errors.videoUrl = 'Entrez une adresse web valide (https://…).'
    }
  }

  return errors
}

function buildInput(draft: SiteDraft): SiteInput {
  return {
    name: draft.name.trim(),
    tagline: emptyToNull(draft.tagline),
    summary: draft.summary.trim(),
    description: draft.description.trim(),
    history: emptyToNull(draft.history),
    department: draft.department as Department,
    city: draft.city.trim(),
    address: emptyToNull(draft.address),
    latitude: parseNumber(draft.latitude) as number,
    longitude: parseNumber(draft.longitude) as number,
    categories: draft.categories,
    vibes: draft.vibes,
    environments: draft.environments,
    climateFeel: draft.climateFeel || null,
    activities: draft.activities,
    highlights: draft.highlights,
    bestMonths: draft.bestMonths,
    bestSeasonNote: emptyToNull(draft.bestSeasonNote),
    avgVisitMinutes: parseNumber(draft.avgVisitMinutes) === null ? null : Math.round(parseNumber(draft.avgVisitMinutes) as number),
    difficulty: draft.difficulty,
    budgetLevel: draft.budgetLevel || null,
    entranceFee: Math.round(parseNumber(draft.entranceFee) ?? 0),
    familyFriendly: draft.familyFriendly,
    accessibleMobility: draft.accessibleMobility,
    practicalInfo: emptyToNull(draft.practicalInfo),
    openingHours: emptyToNull(draft.openingHours),
    coverId: draft.cover[0] ?? null,
    gallery: draft.gallery,
    videoUrl: emptyToNull(draft.videoUrl),
    aiContext: emptyToNull(draft.aiContext),
    status: draft.status,
    featured: draft.featured,
  }
}

interface SiteFormProps {
  agency: Agency
  initial?: Site | null
  onSaved: (site: Site) => void
  onCancel: () => void
}

export function SiteForm({ agency, initial, onSaved, onCancel }: SiteFormProps) {
  const [draft, setDraft] = useState<SiteDraft>(() => toDraft(initial))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const set = (patch: Partial<SiteDraft>) => setDraft((current) => ({ ...current, ...patch }))

  const useMyPosition = async () => {
    setLocating(true)
    try {
      const position = await getCurrentPosition()
      set({ latitude: position.lat.toFixed(6), longitude: position.lng.toFixed(6) })
    } catch (error) {
      toast.error('Position introuvable', geolocationErrorMessage(error))
    } finally {
      setLocating(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const found = validate(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError('Certains champs sont à corriger (en rouge ci-dessous).')
      return
    }

    setSaving(true)
    try {
      const site = await saveSite(agency, buildInput(draft), initial)
      toast.success(initial ? 'Site mis à jour' : 'Site créé')
      onSaved(site)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormSection title="Identité">
        <Input label="Nom du site *" value={draft.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} maxLength={160} />
        <Input label="Accroche" value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} maxLength={200} hint="Une phrase courte affichée sous le nom." />
        <Textarea label="Résumé *" value={draft.summary} onChange={(e) => set({ summary: e.target.value })} error={errors.summary} maxLength={500} showCounter rows={3} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Statut"
            value={draft.status}
            onChange={(value) => value && set({ status: value })}
            options={[
              { value: 'draft', label: 'Brouillon (non visible)' },
              { value: 'published', label: 'Publié' },
              { value: 'archived', label: 'Archivé' },
            ]}
          />
          <div className="self-end">
            <CheckboxField label="Mettre en avant" checked={draft.featured} onChange={(featured) => set({ featured })} hint="Affiché sur l’accueil." />
          </div>
        </div>
      </FormSection>

      <FormSection title="Localisation">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Département"
            required
            value={draft.department}
            onChange={(value) => set({ department: value as Department | '' })}
            options={DEPARTMENTS.map((d) => ({ value: d.value, label: d.label }))}
            placeholder="Choisir…"
            error={errors.department}
          />
          <Input label="Ville *" value={draft.city} onChange={(e) => set({ city: e.target.value })} error={errors.city} maxLength={100} />
        </div>
        <Input label="Adresse" value={draft.address} onChange={(e) => set({ address: e.target.value })} maxLength={255} />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Latitude" required step="any" value={draft.latitude} onChange={(latitude) => set({ latitude })} error={errors.latitude} placeholder="6.3703" />
          <NumberField label="Longitude" required step="any" value={draft.longitude} onChange={(longitude) => set({ longitude })} placeholder="2.3912" />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void useMyPosition()}
          isLoading={locating}
          leftIcon={<LocateFixed className="h-4 w-4" aria-hidden="true" />}
        >
          Utiliser ma position actuelle
        </Button>
      </FormSection>

      <FormSection title="Classification" description="Ces critères servent aux filtres et à la recommandation de Vanessa.">
        <ChipMultiSelect<SiteCategory>
          label="Type de site"
          required
          options={toOptions(SITE_CATEGORY_LABELS)}
          value={draft.categories}
          onChange={(categories) => set({ categories })}
          error={errors.categories}
        />
        <ChipMultiSelect<Vibe> label="Ambiance" options={toOptions(VIBE_LABELS)} value={draft.vibes} onChange={(vibes) => set({ vibes })} />
        <ChipMultiSelect<Environment>
          label="Cadre"
          options={toOptions(ENVIRONMENT_LABELS)}
          value={draft.environments}
          onChange={(environments) => set({ environments })}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Sensation climatique"
            value={draft.climateFeel}
            onChange={(value) => set({ climateFeel: value as ClimateFeel | '' })}
            options={toOptions(CLIMATE_LABELS)}
            placeholder="Non précisée"
          />
          <SelectField
            label="Difficulté"
            value={draft.difficulty}
            onChange={(value) => value && set({ difficulty: value })}
            options={toOptions(DIFFICULTY_LABELS)}
          />
          <SelectField
            label="Budget"
            value={draft.budgetLevel}
            onChange={(value) => set({ budgetLevel: value as BudgetLevel | '' })}
            options={toOptions(SITE_BUDGET_LABELS)}
            placeholder="Non précisé"
          />
        </div>
        <TagsInput label="Activités" value={draft.activities} onChange={(activities) => set({ activities })} placeholder="pirogue, randonnée, safari…" maxLength={64} />
        <TagsInput label="Points forts (ce qu’on peut y voir)" value={draft.highlights} onChange={(highlights) => set({ highlights })} placeholder="Ajoutez un point fort" />
      </FormSection>

      <FormSection title="La visite">
        <MonthsPicker label="Meilleurs mois pour visiter" value={draft.bestMonths} onChange={(bestMonths) => set({ bestMonths })} />
        <Input label="Précision sur la saison" value={draft.bestSeasonNote} onChange={(e) => set({ bestSeasonNote: e.target.value })} maxLength={300} />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Durée moyenne (minutes)" value={draft.avgVisitMinutes} onChange={(avgVisitMinutes) => set({ avgVisitMinutes })} min={0} error={errors.avgVisitMinutes} />
          <NumberField label="Droit d’entrée (F CFA)" value={draft.entranceFee} onChange={(entranceFee) => set({ entranceFee })} min={0} hint="0 si l’entrée est libre." error={errors.entranceFee} />
        </div>
        <Input label="Horaires d’ouverture" value={draft.openingHours} onChange={(e) => set({ openingHours: e.target.value })} maxLength={500} placeholder="Tous les jours de 8h à 18h" />
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckboxField label="Adapté aux familles" checked={draft.familyFriendly} onChange={(familyFriendly) => set({ familyFriendly })} />
          <CheckboxField label="Accessible aux personnes à mobilité réduite" checked={draft.accessibleMobility} onChange={(accessibleMobility) => set({ accessibleMobility })} />
        </div>
      </FormSection>

      <FormSection title="Textes">
        <Textarea label="Description *" value={draft.description} onChange={(e) => set({ description: e.target.value })} error={errors.description} maxLength={20000} showCounter rows={8} />
        <Textarea label="Histoire du site" value={draft.history} onChange={(e) => set({ history: e.target.value })} maxLength={10000} showCounter rows={5} />
        <Textarea label="Infos pratiques" value={draft.practicalInfo} onChange={(e) => set({ practicalInfo: e.target.value })} maxLength={5000} showCounter rows={4} hint="Tenue conseillée, quoi apporter, règles de respect…" />
        <Textarea
          label="Texte pour Vanessa (recommandation)"
          value={draft.aiContext}
          onChange={(e) => set({ aiContext: e.target.value })}
          maxLength={8000}
          showCounter
          rows={5}
          hint="Mots-clés et détails que Vanessa utilise pour proposer ce site (ambiance, ce qu’on y ressent, public idéal…). Non affiché aux visiteurs."
        />
      </FormSection>

      <FormSection title="Photos et vidéo">
        <ImageUploader label="Photo principale" bucket="sites" value={draft.cover} onChange={(cover) => set({ cover })} max={1} />
        <ImageUploader label="Galerie" bucket="sites" value={draft.gallery} onChange={(gallery) => set({ gallery })} max={12} hint="12 photos maximum, 5 Mo chacune." />
        <Input label="Vidéo (adresse web)" value={draft.videoUrl} onChange={(e) => set({ videoUrl: e.target.value })} error={errors.videoUrl} placeholder="https://…" />
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
          {initial ? 'Enregistrer' : 'Créer le site'}
        </Button>
      </div>
    </form>
  )
}