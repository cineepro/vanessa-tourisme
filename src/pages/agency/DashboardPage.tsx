// src/pages/agency/DashboardPage.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { CalendarCheck, Compass, MessageSquareQuote, Sun, Tag, Users, Wallet, type LucideIcon } from 'lucide-react'

import { AdminHeader } from '@/components/agency/AdminHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { BOOKING_STATUS_META, ROUTES } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { formatPrice, formatVisitDate } from '@/lib/format'
import { getAgencyStats } from '@/services/admin.service'
import { useAgency } from './AgencyContext'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  to?: string
  highlight?: boolean
}

function StatCard({ icon: Icon, label, value, to, highlight }: StatCardProps) {
  const content = (
    <div
      className={cn(
        'h-full rounded-3xl border p-5 shadow-card transition-shadow',
        to && 'hover:shadow-lift',
        highlight ? 'border-accent-300 bg-accent-50' : 'border-sable-200 bg-white',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-2xl',
          highlight ? 'bg-accent-400 text-sable-900' : 'bg-primary-100 text-primary-700',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-3xl font-extrabold text-sable-900">{value}</p>
      <p className="text-sm text-sable-600">{label}</p>
    </div>
  )

  return to ? <Link to={to}>{content}</Link> : content
}

export default function DashboardPage() {
  const { agency } = useAgency()
  const { data: stats, isLoading, error } = useAsync(() => getAgencyStats(agency), [agency.$id])

  return (
    <div>
      <AdminHeader title="Tableau de bord" description="L’essentiel de votre activité en un coup d’œil." />

      {isLoading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : error || !stats ? (
        <EmptyState title="Impossible de charger les statistiques" description={error ?? undefined} />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={CalendarCheck}
              label="Réservations à confirmer"
              value={stats.pendingBookings}
              to={`${ROUTES.agency}/reservations`}
              highlight={stats.pendingBookings > 0}
            />
            <StatCard icon={Sun} label="Visites aujourd’hui" value={stats.visitsToday} to={`${ROUTES.agency}/reservations`} />
            <StatCard
              icon={Wallet}
              label="Chiffre du mois (confirmé)"
              value={formatPrice(stats.monthRevenue, agency.currency)}
            />
            <StatCard
              icon={MessageSquareQuote}
              label="Avis à modérer"
              value={stats.pendingReviews}
              to={`${ROUTES.agency}/avis`}
              highlight={stats.pendingReviews > 0}
            />
            <StatCard icon={Compass} label="Sites" value={stats.sites} to={`${ROUTES.agency}/sites`} />
            <StatCard icon={Users} label="Guides" value={stats.guides} to={`${ROUTES.agency}/guides`} />
            <StatCard icon={Tag} label="Offres" value={stats.offers} to={`${ROUTES.agency}/offres`} />
          </div>

          <section aria-labelledby="upcoming-title">
            <h3 id="upcoming-title" className="mb-3 font-display text-lg font-bold text-sable-900">
              Prochaines visites confirmées (14 jours)
            </h3>

            {stats.upcoming.length === 0 ? (
              <p className="rounded-2xl bg-sable-100 px-4 py-4 text-sm text-sable-600">
                Aucune visite confirmée dans les 14 prochains jours.
              </p>
            ) : (
              <ul className="divide-y divide-sable-200 overflow-hidden rounded-3xl border border-sable-200 bg-white">
                {stats.upcoming.map((booking) => (
                  <li key={booking.$id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-sable-900">
                        {booking.siteName ?? 'Visite'} · {booking.contactName}
                      </p>
                      <p className="text-sm text-sable-600">
                        {formatVisitDate(booking.visitDate, 'full')}
                        {booking.startTime ? ` à ${booking.startTime}` : ''} · {booking.adults + booking.children}{' '}
                        personne{booking.adults + booking.children > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        BOOKING_STATUS_META[booking.status].className,
                      )}
                    >
                      {BOOKING_STATUS_META[booking.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}