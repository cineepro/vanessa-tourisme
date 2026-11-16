// src/components/booking/BookingSummary.tsx — Vanessa Tourisme
import { CalendarDays, Clock, MapPin, ShieldCheck, UserRound, Users } from 'lucide-react'

import { CANCELLATION_POLICY_LABELS, PAYMENT_MODE_LABELS } from '@/config/constants'
import { cn } from '@/lib/cn'
import { formatDuration, formatPrice, formatVisitDate, dateKeyToIso } from '@/lib/format'
import { computeBookingTotal, getDepositAmount } from '@/services/offers.service'
import { siteCoverUrl } from '@/services/storage.service'
import type { OfferDetail } from '@/types'

interface BookingSummaryProps {
  offer: OfferDetail
  /** "YYYY-MM-DD" */
  visitDate: string | null
  startTime: string | null
  adults: number
  childCount: number
  /** Prix du créneau choisi, s'il diffère du tarif de base */
  priceOverride?: number | null
  className?: string
}

/** Récapitulatif et prix d'une réservation (le montant officiel est recalculé côté serveur). */
export function BookingSummary({
  offer,
  visitDate,
  startTime,
  adults,
  childCount,
  priceOverride = null,
  className,
}: BookingSummaryProps) {
  const price = computeBookingTotal(offer, adults, childCount, priceOverride)
  const deposit = getDepositAmount(offer, price.total)
  const cover = offer.site ? siteCoverUrl(offer.site, { width: 600, height: 300 }) : null
  const policy = CANCELLATION_POLICY_LABELS[offer.cancellationPolicy]

  return (
    <aside className={cn('overflow-hidden rounded-3xl border border-sable-200 bg-white shadow-card', className)}>
      {cover && <img src={cover} alt="" className="h-36 w-full object-cover" />}

      <div className="space-y-4 p-5">
        <div>
          <h2 className="font-display text-lg font-bold text-sable-900">{offer.title}</h2>
          {offer.site && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-sable-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {offer.site.name}, {offer.site.city}
            </p>
          )}
        </div>

        <ul className="space-y-2 text-sm text-sable-700">
          {offer.guide && (
            <li className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-sable-400" aria-hidden="true" />
              Guide : {offer.guide.fullName}
            </li>
          )}
          <li className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-sable-400" aria-hidden="true" />
            {visitDate ? formatVisitDate(dateKeyToIso(visitDate), 'full') : 'Date à choisir'}
          </li>
          {(startTime || offer.durationMinutes) && (
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sable-400" aria-hidden="true" />
              {startTime ? `Départ à ${startTime}` : null}
              {startTime && offer.durationMinutes ? ' · ' : null}
              {offer.durationMinutes ? `Durée ${formatDuration(offer.durationMinutes)}` : null}
            </li>
          )}
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sable-400" aria-hidden="true" />
            {adults} adulte{adults > 1 ? 's' : ''}
            {childCount > 0 ? `, ${childCount} enfant${childCount > 1 ? 's' : ''}` : ''}
          </li>
        </ul>

        <div className="space-y-1.5 border-t border-sable-100 pt-4 text-sm">
          {offer.pricingType === 'per_person' ? (
            <>
              <PriceLine
                label={`${adults} × ${formatPrice(price.unitPrice, offer.currency)}`}
                value={formatPrice(adults * price.unitPrice, offer.currency)}
              />
              {childCount > 0 && (
                <PriceLine
                  label={`${childCount} × ${formatPrice(price.childUnitPrice, offer.currency, { free: true })}`}
                  value={formatPrice(childCount * price.childUnitPrice, offer.currency, { free: true })}
                />
              )}
            </>
          ) : (
            <PriceLine label="Tarif groupe" value={formatPrice(price.unitPrice, offer.currency)} />
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold text-sable-900">Total</span>
            <span className="font-display text-2xl font-bold text-primary-700">
              {formatPrice(price.total, offer.currency)}
            </span>
          </div>

          {deposit > 0 && (
            <p className="text-xs text-sable-500">
              Acompte à régler en ligne : {formatPrice(deposit, offer.currency)}
            </p>
          )}
        </div>

        <div className="space-y-2 rounded-2xl bg-sable-100 p-3 text-xs text-sable-600">
          <p>
            <span className="font-semibold">{PAYMENT_MODE_LABELS[offer.paymentMode]}.</span>{' '}
            {offer.instantConfirm
              ? 'Confirmation immédiate.'
              : 'L’agence confirme votre demande sous peu.'}
          </p>
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" aria-hidden="true" />
            <span>
              Annulation {policy.label.toLowerCase()} : {policy.description} Délai : {offer.cancellationHours} h.
            </span>
          </p>
        </div>
      </div>
    </aside>
  )
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sable-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}