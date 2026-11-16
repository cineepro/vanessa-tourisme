// src/pages/account/MyBookingsPage.tsx — Vanessa Tourisme
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarX } from 'lucide-react'

import { BookingCard } from '@/components/booking/BookingCard'
import { CancelBookingModal } from '@/components/booking/CancelBookingModal'
import { buttonClasses } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES } from '@/config/constants'
import { useBookings } from '@/hooks/useBookings'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import type { Booking } from '@/types'

type Tab = 'upcoming' | 'past'

export default function MyBookingsPage() {
  useDocumentTitle('Mes réservations')

  const { upcoming, past, isLoading, error, reload, cancelBooking, bookings } = useBookings()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)

  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <h1 className="text-3xl font-bold text-sable-900 sm:text-4xl">Mes réservations</h1>

      <div className="mt-6 flex gap-2" role="tablist" aria-label="Filtrer les réservations">
        {(
          [
            { key: 'upcoming', label: 'À venir', count: upcoming.length },
            { key: 'past', label: 'Historique', count: past.length },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              tab === item.key ? 'bg-primary-600 text-white' : 'bg-white text-sable-700 hover:bg-sable-100',
            )}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {isLoading && bookings.length === 0 ? (
          [0, 1].map((index) => <Skeleton key={index} className="h-36 rounded-3xl" />)
        ) : error && bookings.length === 0 ? (
          <EmptyState
            title="Impossible de charger vos réservations"
            description={error}
            action={
              <button type="button" onClick={() => void reload()} className="font-semibold text-primary-700 hover:underline">
                Réessayer
              </button>
            }
          />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<CalendarX className="h-6 w-6" aria-hidden="true" />}
            title={tab === 'upcoming' ? 'Aucune visite prévue' : 'Aucune réservation passée'}
            description={
              tab === 'upcoming'
                ? 'Dites à Vanessa ce que vous voulez vivre, elle vous propose le site qui vous correspond.'
                : 'Vos visites terminées ou annulées apparaîtront ici.'
            }
            action={
              <Link to={ROUTES.sites} className={buttonClasses({})}>
                Découvrir les sites
              </Link>
            }
          />
        ) : (
          shown.map((booking) => (
            <BookingCard
              key={booking.$id}
              booking={booking}
              onCancel={tab === 'upcoming' ? setCancelTarget : undefined}
            />
          ))
        )}
      </div>

      <CancelBookingModal
        booking={cancelTarget}
        onCancel={cancelBooking}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  )
}