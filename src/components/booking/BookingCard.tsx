// src/components/booking/BookingCard.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, Users } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BOOKING_STATUS_META, ROUTES } from '@/config/constants'
import { formatPrice, formatVisitDate } from '@/lib/format'
import { canCancel } from '@/services/bookings.service'
import type { Booking } from '@/types'

interface BookingCardProps {
  booking: Booking
  onCancel?: (booking: Booking) => void
}

/** Ligne de la liste « Mes réservations ». */
export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const status = BOOKING_STATUS_META[booking.status]

  return (
    <article className="rounded-3xl border border-sable-200 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-sable-500">
            {booking.reference}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-sable-900">
            {booking.siteName ?? 'Visite guidée'}
          </h3>
          {booking.offerTitle && <p className="text-sm text-sable-600">{booking.offerTitle}</p>}
        </div>
        <Badge className={status.className}>{status.label}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-sable-600">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-sable-400" aria-hidden="true" />
          {formatVisitDate(booking.visitDate, 'long')}
          {booking.startTime ? ` à ${booking.startTime}` : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-sable-400" aria-hidden="true" />
          {booking.adults} adulte{booking.adults > 1 ? 's' : ''}
          {booking.children > 0 ? `, ${booking.children} enfant${booking.children > 1 ? 's' : ''}` : ''}
        </span>
        <span className="font-semibold text-sable-900">
          {formatPrice(booking.totalAmount, booking.currency)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          to={ROUTES.booking(booking.$id)}
          className="inline-flex h-9 items-center gap-1 rounded-full bg-primary-50 px-4 text-sm font-semibold text-primary-800 hover:bg-primary-100"
        >
          Voir le billet
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {onCancel && canCancel(booking) && (
          <Button variant="ghost" size="sm" onClick={() => onCancel(booking)}>
            Annuler
          </Button>
        )}
      </div>
    </article>
  )
}