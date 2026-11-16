// src/pages/agency/BookingsAdminPage.tsx — Vanessa Tourisme
import { useState } from 'react'
import { CalendarCheck, MessageCircle, Phone } from 'lucide-react'

import { AdminHeader } from '@/components/agency/AdminHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { BOOKING_STATUS_META, PAYMENT_STATUS_LABELS } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/appwrite'
import { cn } from '@/lib/cn'
import { formatPrice, formatVisitDate, telUrl, whatsappUrl } from '@/lib/format'
import { listAgencyBookings, updateBookingStatus } from '@/services/bookings.service'
import { toast } from '@/store/ui.store'
import type { Booking, BookingAction, BookingStatus } from '@/types'
import { useAgency } from './AgencyContext'

type FilterKey = 'all' | 'pending' | 'confirmed' | 'done' | 'cancelled'

const FILTERS: { key: FilterKey; label: string; statuses?: BookingStatus[] }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'À confirmer', statuses: ['pending'] },
  { key: 'confirmed', label: 'Confirmées', statuses: ['confirmed'] },
  { key: 'done', label: 'Terminées', statuses: ['completed', 'no_show'] },
  { key: 'cancelled', label: 'Annulées', statuses: ['rejected', 'cancelled_by_user', 'cancelled_by_agency'] },
]

const PAGE_SIZE = 20

const SUCCESS: Record<BookingAction, string> = {
  confirm: 'Réservation confirmée',
  reject: 'Réservation refusée',
  cancel: 'Réservation annulée',
  complete: 'Visite marquée comme terminée',
  no_show: 'Absence enregistrée',
}

export default function BookingsAdminPage() {
  const { agency, canEdit } = useAgency()

  const [filter, setFilter] = useState<FilterKey>('pending')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const statuses = FILTERS.find((item) => item.key === filter)?.statuses

  const { data, isLoading, error, reload } = useAsync(
    () =>
      listAgencyBookings(agency.$id, {
        status: statuses,
        from: from || undefined,
        to: to || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    [agency.$id, filter, from, to, page],
  )

  const [busyId, setBusyId] = useState<string | null>(null)
  const [askReason, setAskReason] = useState<{ booking: Booking; action: 'reject' | 'cancel' } | null>(null)
  const [reason, setReason] = useState('')

  const run = async (booking: Booking, action: BookingAction, why?: string) => {
    setBusyId(booking.$id)
    try {
      await updateBookingStatus({ bookingId: booking.$id, action, reason: why })
      toast.success(SUCCESS[action])
      reload()
    } catch (err) {
      toast.error('Action impossible', getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const openReason = (booking: Booking, action: 'reject' | 'cancel') => {
    setReason('')
    setAskReason({ booking, action })
  }

  const confirmReason = async () => {
    if (!askReason) return
    const { booking, action } = askReason
    setAskReason(null)
    await run(booking, action, reason.trim() || undefined)
  }

  const changeFilter = (next: FilterKey) => {
    setFilter(next)
    setPage(1)
  }

  return (
    <div>
      <AdminHeader title="Réservations" description="Confirmez les demandes et suivez les visites de vos clients." />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={filter === item.key}
            onClick={() => changeFilter(item.key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              filter === item.key ? 'bg-primary-600 text-white' : 'bg-white text-sable-700 hover:bg-sable-100',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Input
          label="Visites à partir du"
          type="date"
          value={from}
          onChange={(event) => {
            setFrom(event.target.value)
            setPage(1)
          }}
        />
        <Input
          label="Jusqu’au"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => {
            setTo(event.target.value)
            setPage(1)
          }}
        />
      </div>

      {isLoading && !data ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Impossible de charger les réservations" description={error} action={<Button variant="outline" onClick={reload}>Réessayer</Button>} />
      ) : !data || data.documents.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-6 w-6" aria-hidden="true" />}
          title="Aucune réservation"
          description="Rien à afficher pour ce filtre."
        />
      ) : (
        <ul className="space-y-4">
          {data.documents.map((booking) => {
            const status = BOOKING_STATUS_META[booking.status]
            const busy = busyId === booking.$id
            return (
              <li key={booking.$id} className="rounded-3xl border border-sable-200 bg-white p-4 shadow-card sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-sable-500">{booking.reference}</p>
                    <h3 className="font-display text-base font-bold text-sable-900">
                      {booking.siteName ?? 'Visite'} {booking.offerTitle ? `· ${booking.offerTitle}` : ''}
                    </h3>
                    <p className="mt-0.5 text-sm text-sable-600">
                      {formatVisitDate(booking.visitDate, 'full')}
                      {booking.startTime ? ` à ${booking.startTime}` : ''}
                    </p>
                  </div>
                  <Badge className={status.className}>{status.label}</Badge>
                </div>

                <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="inline text-sable-500">Client : </dt>
                    <dd className="inline font-medium text-sable-900">{booking.contactName}</dd>
                  </div>
                  <div>
                    <dt className="inline text-sable-500">Participants : </dt>
                    <dd className="inline font-medium text-sable-900">
                      {booking.adults} adulte{booking.adults > 1 ? 's' : ''}
                      {booking.children > 0 ? `, ${booking.children} enfant${booking.children > 1 ? 's' : ''}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-sable-500">Montant : </dt>
                    <dd className="inline font-medium text-sable-900">{formatPrice(booking.totalAmount, booking.currency)}</dd>
                  </div>
                  <div>
                    <dt className="inline text-sable-500">Paiement : </dt>
                    <dd className="inline font-medium text-sable-900">{PAYMENT_STATUS_LABELS[booking.paymentStatus]}</dd>
                  </div>
                  {booking.guideName && (
                    <div>
                      <dt className="inline text-sable-500">Guide : </dt>
                      <dd className="inline font-medium text-sable-900">{booking.guideName}</dd>
                    </div>
                  )}
                  {booking.pickupLocation && (
                    <div>
                      <dt className="inline text-sable-500">Prise en charge : </dt>
                      <dd className="inline font-medium text-sable-900">{booking.pickupLocation}</dd>
                    </div>
                  )}
                </dl>

                {booking.specialRequests && (
                  <p className="mt-3 rounded-2xl bg-sable-100 px-4 py-3 text-sm text-sable-700">
                    <span className="font-semibold">Demandes :</span> {booking.specialRequests}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sable-100 pt-3">
                  <a
                    href={whatsappUrl(booking.contactPhone, `Bonjour ${booking.contactName}, à propos de votre réservation ${booking.reference}…`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sable-300 px-3 text-sm font-semibold text-sable-700 hover:bg-sable-100"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                  <a
                    href={telUrl(booking.contactPhone)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sable-300 px-3 text-sm font-semibold text-sable-700 hover:bg-sable-100"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Appeler
                  </a>

                  {canEdit && booking.status === 'pending' && (
                    <>
                      <Button size="sm" isLoading={busy} onClick={() => void run(booking, 'confirm')}>
                        Confirmer
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => openReason(booking, 'reject')}>
                        Refuser
                      </Button>
                    </>
                  )}

                  {canEdit && booking.status === 'confirmed' && (
                    <>
                      <Button size="sm" isLoading={busy} onClick={() => void run(booking, 'complete')}>
                        Visite terminée
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(booking, 'no_show')}>
                        Client absent
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => openReason(booking, 'cancel')}>
                        Annuler
                      </Button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Pagination
        page={page}
        total={data?.total ?? 0}
        pageSize={PAGE_SIZE}
        onChange={(next) => {
          setPage(next)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        className="mt-8"
      />

      <ConfirmDialog
        open={askReason !== null}
        title={askReason?.action === 'reject' ? 'Refuser cette demande ?' : 'Annuler cette réservation ?'}
        description="Le client sera informé. Vous pouvez lui indiquer la raison."
        confirmLabel={askReason?.action === 'reject' ? 'Refuser' : 'Annuler la réservation'}
        danger
        onConfirm={() => void confirmReason()}
        onClose={() => setAskReason(null)}
      >
        <Textarea
          label="Motif (optionnel)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          showCounter
          rows={3}
        />
      </ConfirmDialog>
    </div>
  )
}