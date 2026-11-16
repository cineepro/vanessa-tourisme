// src/pages/account/BookingDetailPage.tsx — Vanessa Tourisme
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, MapPin, MessageCircle, Navigation } from 'lucide-react'

import { BookingTicket } from '@/components/booking/BookingTicket'
import { CancelBookingModal } from '@/components/booking/CancelBookingModal'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { Button, buttonClasses } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PAYMENT_MODE_LABELS, PAYMENT_STATUS_LABELS, ROUTES } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { directionsUrl } from '@/lib/geo'
import { getBooking, canCancel, canReview } from '@/services/bookings.service'
import { getOfferDetail } from '@/services/offers.service'
import { useBookingStore } from '@/store/booking.store'
import type { Booking } from '@/types'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const storeCancel = useBookingStore((s) => s.cancelBooking)

  const { data: booking, isLoading, error, reload } = useAsync(() => getBooking(id as string), [id], {
    enabled: Boolean(id),
  })
  const { data: offer } = useAsync(() => getOfferDetail(booking!.offerId), [booking?.offerId], {
    enabled: Boolean(booking),
  })

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)

  useDocumentTitle(booking ? `Réservation ${booking.reference}` : 'Réservation')

  if (isLoading && !booking) {
    return (
      <div className="container-page max-w-3xl space-y-4 py-8" aria-hidden="true">
        <Skeleton className="h-52 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Réservation introuvable"
          description={error ?? 'Cette réservation n’existe pas ou ne vous appartient pas.'}
          action={
            <Link to={ROUTES.bookings} className={buttonClasses({ variant: 'outline' })}>
              Mes réservations
            </Link>
          }
        />
      </div>
    )
  }

  const cancel = async (bookingId: string, reason?: string): Promise<boolean> => {
    const ok = await storeCancel(bookingId, reason)
    if (ok) reload()
    return ok
  }

  const site = offer?.site

  return (
    <div className="container-page max-w-3xl space-y-6 py-6 sm:py-10">
      <nav aria-label="Fil d’Ariane" className="flex items-center gap-1 text-sm text-sable-500">
        <Link to={ROUTES.bookings} className="hover:text-primary-700">
          Mes réservations
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-sable-800">{booking.reference}</span>
      </nav>

      <BookingTicket booking={booking} />

      <section className="rounded-3xl border border-sable-200 bg-white p-5 shadow-card sm:p-6" aria-labelledby="details-title">
        <h2 id="details-title" className="font-display text-lg font-bold text-sable-900">
          Détails
        </h2>

        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Prestation" value={booking.offerTitle} />
          <Detail label="Guide" value={booking.guideName} />
          <Detail label="Contact" value={`${booking.contactName} · ${booking.contactPhone}`} />
          <Detail label="Email" value={booking.contactEmail} />
          <Detail label="Prise en charge" value={booking.pickupLocation} />
          <Detail label="Paiement" value={`${PAYMENT_STATUS_LABELS[booking.paymentStatus]}${booking.paymentMode ? ` · ${PAYMENT_MODE_LABELS[booking.paymentMode]}` : ''}`} />
          <Detail label="Demandes particulières" value={booking.specialRequests} wide />
          {booking.cancelReason && <Detail label="Motif d’annulation" value={booking.cancelReason} wide />}
        </dl>

        {offer?.meetingPoint && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sable-100 p-4">
            <p className="flex items-start gap-2 text-sm text-sable-800">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
              <span>
                <span className="font-semibold">Point de rendez-vous :</span> {offer.meetingPoint}
              </span>
            </p>
            {offer.meetingLat != null && offer.meetingLng != null && (
              <a
                href={directionsUrl({ lat: offer.meetingLat, lng: offer.meetingLng })}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Itinéraire
              </a>
            )}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        {site && (
          <Link to={ROUTES.site(site.slug)} className={buttonClasses({ variant: 'outline' })}>
            Voir la fiche du site
          </Link>
        )}
        <Link
          to={`${ROUTES.chat}?mode=culture&site=${booking.siteId}`}
          className={buttonClasses({ variant: 'accent' })}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Préparer ma visite avec Vanessa
        </Link>
        {canCancel(booking) && (
          <Button variant="ghost" onClick={() => setCancelTarget(booking)}>
            Annuler la réservation
          </Button>
        )}
      </div>

      {canReview(booking) && <ReviewForm booking={booking} onSubmitted={reload} />}

      <CancelBookingModal booking={cancelTarget} onCancel={cancel} onClose={() => setCancelTarget(null)} />
    </div>
  )
}

function Detail({ label, value, wide }: { label: string; value: string | null | undefined; wide?: boolean }) {
  if (!value) return null
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-sable-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sable-900">{value}</dd>
    </div>
  )
}