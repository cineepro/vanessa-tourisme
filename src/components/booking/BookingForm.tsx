// src/components/booking/BookingForm.tsx — Vanessa Tourisme
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CircleCheck, CircleX } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

import { Button, buttonClasses } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { isValidEmail, normalizePhone } from '@/lib/validators'
import { validateParticipants } from '@/services/offers.service'
import { useBookingStore, type BookingStep } from '@/store/booking.store'
import type { Availability, Booking, OfferDetail } from '@/types'
import { BookingSummary } from './BookingSummary'
import { BookingTicket } from './BookingTicket'
import { DatePicker } from './DatePicker'
import { ParticipantsPicker } from './ParticipantsPicker'

interface BookingFormProps {
  offer: OfferDetail
  /** Réservation créée avec succès */
  onDone?: (booking: Booking) => void
}

const STEPS: { key: Exclude<BookingStep, 'done'>; label: string }[] = [
  { key: 'choose', label: 'Date et participants' },
  { key: 'contact', label: 'Vos coordonnées' },
  { key: 'review', label: 'Confirmation' },
]

export function BookingForm({ offer, onDone }: BookingFormProps) {
  const { user, profile } = useAuth()
  const {
    draft,
    step,
    isSubmitting,
    error,
    lastBooking,
    setDraft,
    setStep,
    startFor,
    prefill,
    submit,
    clearError,
  } = useBookingStore(
    useShallow((s) => ({
      draft: s.draft,
      step: s.step,
      isSubmitting: s.isSubmitting,
      error: s.error,
      lastBooking: s.lastBooking,
      setDraft: s.setDraft,
      setStep: s.setStep,
      startFor: s.startFor,
      prefill: s.prefill,
      submit: s.submit,
      clearError: s.clearError,
    })),
  )

  const [slot, setSlot] = useState<Availability | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    startFor(offer.$id)
  }, [offer.$id, startFor])

  useEffect(() => {
    if (user) prefill(user, profile)
  }, [user, profile, prefill])

  const isSlots = offer.bookingMode === 'slots'

  /* ---------------- Étape 1 : date et participants ---------------- */
  const handleDate = (dateKey: string) => {
    setSlot(null)
    setDraft({ visitDate: dateKey, startTime: null, availabilityId: null })
    setErrors({})
  }

  const handleSlot = (value: Availability | null) => {
    setSlot(value)
    setDraft({ availabilityId: value?.$id ?? null, startTime: value?.startTime ?? null })
  }

  const goToContact = () => {
    const next: Record<string, string> = {}
    if (!draft.visitDate) next.date = 'Choisissez une date de visite.'
    else if (isSlots && !draft.availabilityId) next.date = 'Choisissez un horaire.'

    const participants = validateParticipants(offer, draft.adults, draft.children)
    if (!participants.bookable && participants.reason) next.participants = participants.reason

    setErrors(next)
    if (Object.keys(next).length === 0) setStep('contact')
  }

  /* ---------------- Étape 2 : coordonnées ---------------- */
  const goToReview = () => {
    const next: Record<string, string> = {}
    if (draft.contactName.trim().length < 2) next.contactName = 'Entrez votre nom complet.'
    if (!normalizePhone(draft.contactPhone)) next.contactPhone = 'Entrez un numéro de téléphone valide.'
    if (draft.contactEmail.trim() && !isValidEmail(draft.contactEmail)) {
      next.contactEmail = 'Cette adresse email n’est pas valide.'
    }

    setErrors(next)
    if (Object.keys(next).length === 0) setStep('review')
  }

  /* ---------------- Étape 3 : confirmation ---------------- */
  const confirm = async () => {
    if (!accepted) {
      setErrors({ accepted: 'Acceptez les conditions d’annulation pour continuer.' })
      return
    }
    setErrors({})

    const phone = normalizePhone(draft.contactPhone)
    if (phone) setDraft({ contactPhone: phone })

    const booking = await submit(offer)
    if (booking) onDone?.(booking)
  }

  /* ---------------- Réservation terminée ---------------- */
  if (step === 'done' && lastBooking) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-3xl border border-primary-200 bg-primary-50 p-5">
          <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary-600" aria-hidden="true" />
          <div>
            <h2 className="font-display text-xl font-bold text-primary-900">
              {lastBooking.status === 'confirmed' ? 'Réservation confirmée !' : 'Demande envoyée !'}
            </h2>
            <p className="mt-1 text-sm text-primary-800">
              {lastBooking.status === 'confirmed'
                ? 'Votre billet est prêt. Vous recevrez aussi un rappel avant la visite.'
                : 'L’agence va examiner votre demande. Vous serez notifié dès qu’elle sera confirmée.'}
            </p>
          </div>
        </div>

        <BookingTicket booking={lastBooking} />

        <div className="flex flex-wrap gap-3">
          <Link to={ROUTES.bookings} className={buttonClasses({ variant: 'primary' })}>
            Voir mes réservations
          </Link>
          <Link to={ROUTES.chat} className={buttonClasses({ variant: 'outline' })}>
            Demander conseil à Vanessa
          </Link>
        </div>
      </div>
    )
  }

  const currentIndex = STEPS.findIndex((item) => item.key === step)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <ol className="flex items-center gap-2" aria-label="Étapes de la réservation">
          {STEPS.map((item, index) => {
            const done = index < currentIndex
            const active = index === currentIndex
            return (
              <li key={item.key} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    done && 'bg-primary-600 text-white',
                    active && 'bg-accent-400 text-sable-900',
                    !done && !active && 'bg-sable-200 text-sable-500',
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'hidden text-sm font-medium sm:block',
                    active ? 'text-sable-900' : 'text-sable-500',
                  )}
                >
                  {item.label}
                </span>
                {index < STEPS.length - 1 && <span className="h-px flex-1 bg-sable-200" />}
              </li>
            )
          })}
        </ol>

        {step === 'choose' && (
          <div className="space-y-5">
            <section>
              <h2 className="mb-3 font-display text-lg font-bold text-sable-900">
                Quand souhaitez-vous visiter ?
              </h2>
              <DatePicker
                offer={offer}
                value={draft.visitDate}
                onChange={handleDate}
                slot={slot}
                onSlotChange={handleSlot}
              />
              {errors.date && <FieldError message={errors.date} />}
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-bold text-sable-900">Combien de personnes ?</h2>
              <ParticipantsPicker
                offer={offer}
                adults={draft.adults}
                childCount={draft.children}
                onChange={(value) => setDraft(value)}
              />
              {errors.participants && <FieldError message={errors.participants} />}
            </section>

            <Button size="lg" onClick={goToContact}>
              Continuer
            </Button>
          </div>
        )}

        {step === 'contact' && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-sable-900">Vos coordonnées</h2>

            <Input
              label="Nom complet"
              autoComplete="name"
              value={draft.contactName}
              onChange={(event) => setDraft({ contactName: event.target.value })}
              error={errors.contactName}
              required
            />
            <Input
              label="Téléphone (WhatsApp de préférence)"
              type="tel"
              autoComplete="tel"
              value={draft.contactPhone}
              onChange={(event) => setDraft({ contactPhone: event.target.value })}
              placeholder="+229 01 23 45 67 89"
              hint="Le guide peut vous joindre ici le jour de la visite."
              error={errors.contactPhone}
              required
            />
            <Input
              label="Email (optionnel)"
              type="email"
              autoComplete="email"
              value={draft.contactEmail}
              onChange={(event) => setDraft({ contactEmail: event.target.value })}
              error={errors.contactEmail}
            />
            <Input
              label="Nationalité (optionnel)"
              value={draft.nationality}
              onChange={(event) => setDraft({ nationality: event.target.value })}
            />
            <Input
              label="Lieu de prise en charge (optionnel)"
              value={draft.pickupLocation}
              onChange={(event) => setDraft({ pickupLocation: event.target.value })}
              placeholder="Hôtel, quartier, adresse…"
            />
            <Textarea
              label="Demandes particulières (optionnel)"
              value={draft.specialRequests}
              onChange={(event) => setDraft({ specialRequests: event.target.value })}
              maxLength={1000}
              showCounter
              rows={3}
              placeholder="Allergies, mobilité réduite, langue souhaitée…"
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" size="lg" onClick={() => setStep('choose')}>
                Retour
              </Button>
              <Button size="lg" onClick={goToReview}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-bold text-sable-900">Vérifiez et confirmez</h2>

            <dl className="space-y-3 rounded-3xl border border-sable-200 bg-white p-5 text-sm">
              <ReviewRow label="Nom" value={draft.contactName} />
              <ReviewRow label="Téléphone" value={draft.contactPhone} />
              {draft.contactEmail && <ReviewRow label="Email" value={draft.contactEmail} />}
              {draft.pickupLocation && <ReviewRow label="Prise en charge" value={draft.pickupLocation} />}
              {draft.specialRequests && <ReviewRow label="Demandes" value={draft.specialRequests} />}
            </dl>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sable-100 p-4 text-sm text-sable-700">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600"
              />
              <span>
                J’ai pris connaissance du prix et des conditions d’annulation de cette prestation.
              </span>
            </label>
            {errors.accepted && <FieldError message={errors.accepted} />}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
              >
                <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  clearError()
                  setStep('contact')
                }}
              >
                Retour
              </Button>
              <Button size="lg" onClick={confirm} isLoading={isSubmitting}>
                {offer.instantConfirm ? 'Confirmer la réservation' : 'Envoyer ma demande'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <BookingSummary
          offer={offer}
          visitDate={draft.visitDate}
          startTime={draft.startTime}
          adults={draft.adults}
          childCount={draft.children}
          priceOverride={slot?.priceOverride ?? null}
        />
      </div>
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-2 text-sm text-danger-700">
      {message}
    </p>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sable-500">{label}</dt>
      <dd className="text-right font-medium text-sable-900">{value}</dd>
    </div>
  )
}