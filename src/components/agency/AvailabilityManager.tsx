// src/components/agency/AvailabilityManager.tsx — Vanessa Tourisme
import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/appwrite'
import { formatPrice, formatVisitDate, dateKeyToIso, toDateKey } from '@/lib/format'
import {
  createSlots,
  deleteSlot,
  expandDates,
  listOfferSlots,
  updateSlot,
} from '@/services/admin.service'
import { toast } from '@/store/ui.store'
import type { Agency, Availability, Offer } from '@/types'
import { FormSection, NumberField, TagsInput, WeekdaysPicker, parseNumber } from './FormFields'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const MAX_DAYS = 120

/** Ouverture et gestion des créneaux d'une offre en mode "slots". */
export function AvailabilityManager({ offer, agency }: { offer: Offer; agency: Agency }) {
  const today = toDateKey(new Date())

  const { data: slots, isLoading, error, reload } = useAsync(() => listOfferSlots(offer.$id, today), [offer.$id])

  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0])
  const [times, setTimes] = useState<string[]>(['09:00'])
  const [capacity, setCapacity] = useState(String(offer.maxParticipants))
  const [priceOverride, setPriceOverride] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const badTime = times.find((time) => !TIME.test(time))
    const cap = parseNumber(capacity)
    const price = parseNumber(priceOverride)
    const dates = expandDates(from, to, weekdays)

    if (to < from) return setFormError('La date de fin est avant la date de début.')
    if (dates.length === 0) return setFormError('Aucune date ne correspond à cette période et à ces jours.')
    if (dates.length > MAX_DAYS) return setFormError(`Ouvrez au maximum ${MAX_DAYS} dates à la fois.`)
    if (times.length === 0) return setFormError('Ajoutez au moins un horaire.')
    if (badTime) return setFormError(`Horaire invalide : « ${badTime} ». Utilisez le format 09:30.`)
    if (cap === null || cap < 1) return setFormError('Indiquez le nombre de places.')
    if (priceOverride.trim() && (price === null || price < 0)) return setFormError('Prix du créneau invalide.')

    setCreating(true)
    try {
      const created = await createSlots(offer, agency.teamId, {
        dates,
        times,
        capacity: Math.round(cap),
        priceOverride: price === null ? null : Math.round(price),
      })
      toast.success(
        created > 0 ? `${created} créneau${created > 1 ? 'x' : ''} ouvert${created > 1 ? 's' : ''}` : 'Ces créneaux existent déjà',
      )
      reload()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const toggleStatus = async (slot: Availability) => {
    try {
      await updateSlot(slot.$id, { status: slot.status === 'closed' ? 'open' : 'closed' })
      reload()
    } catch (err) {
      toast.error('Action impossible', getErrorMessage(err))
    }
  }

  const remove = async (slot: Availability) => {
    try {
      await deleteSlot(slot.$id)
      reload()
    } catch (err) {
      toast.error('Suppression impossible', getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleCreate} className="space-y-4" noValidate>
        <FormSection title="Ouvrir des créneaux">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Du" type="date" value={from} min={today} onChange={(e) => setFrom(e.target.value)} />
            <Input label="Au" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </div>
          <WeekdaysPicker label="Jours concernés" value={weekdays} onChange={setWeekdays} />
          <TagsInput
            label="Horaires de départ"
            value={times}
            onChange={setTimes}
            placeholder="09:00"
            hint="Format 09:30. Entrée pour ajouter plusieurs horaires."
            maxLength={5}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Places par créneau" value={capacity} onChange={setCapacity} min={1} />
            <NumberField
              label="Prix particulier (optionnel)"
              value={priceOverride}
              onChange={setPriceOverride}
              min={0}
              hint="Laissez vide pour le tarif de l’offre."
            />
          </div>

          {formError && (
            <p role="alert" className="text-sm text-danger-700">
              {formError}
            </p>
          )}

          <Button type="submit" isLoading={creating}>
            Ouvrir les créneaux
          </Button>
        </FormSection>
      </form>

      <section aria-label="Créneaux ouverts">
        <h3 className="mb-3 font-display text-base font-bold text-sable-900">Créneaux à venir</h3>

        {isLoading && !slots ? (
          <Spinner />
        ) : error ? (
          <p role="alert" className="text-sm text-danger-700">
            {error}
          </p>
        ) : !slots || slots.length === 0 ? (
          <p className="rounded-2xl bg-sable-100 px-4 py-3 text-sm text-sable-600">Aucun créneau ouvert pour le moment.</p>
        ) : (
          <ul className="divide-y divide-sable-200 rounded-2xl border border-sable-200 bg-white">
            {slots.map((slot) => (
              <li key={slot.$id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sable-900">
                    {formatVisitDate(dateKeyToIso(slot.dateKey), 'full')} · {slot.startTime}
                  </p>
                  <p className="text-xs text-sable-500">
                    {slot.booked} / {slot.capacity} place{slot.capacity > 1 ? 's' : ''} réservée{slot.booked > 1 ? 's' : ''}
                    {slot.priceOverride != null ? ` · ${formatPrice(slot.priceOverride, offer.currency)}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone={slot.status === 'open' ? 'primary' : slot.status === 'full' ? 'accent' : 'neutral'}>
                    {slot.status === 'open' ? 'Ouvert' : slot.status === 'full' ? 'Complet' : 'Fermé'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => void toggleStatus(slot)}>
                    {slot.status === 'closed' ? 'Rouvrir' : 'Fermer'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => void remove(slot)}
                    disabled={slot.booked > 0}
                    title={slot.booked > 0 ? 'Des réservations existent : fermez le créneau plutôt que de le supprimer.' : 'Supprimer'}
                    aria-label="Supprimer le créneau"
                    className="rounded-full p-2 text-sable-500 hover:bg-danger-50 hover:text-danger-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}