// src/components/guides/PriceTable.tsx — Vanessa Tourisme
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Languages, Tag } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PRICING_TYPE_LABELS, ROUTES, SPOKEN_LANGUAGE_LABELS } from '@/config/constants'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { formatDuration, formatPrice } from '@/lib/format'
import type { OfferDetail } from '@/types'

interface PriceTableProps {
  offers: OfferDetail[]
  /** Affiche le nom du guide (désactiver sur la page d'un guide) */
  showGuide?: boolean
  /** Affiche le site de chaque prestation (page d'un guide) */
  showSite?: boolean
}

/** Prestations et tarifs, avec le bouton de réservation (connexion demandée si besoin). */
export function PriceTable({ offers, showGuide = true, showSite = false }: PriceTableProps) {
  const requireAuth = useRequireAuth()
  const navigate = useNavigate()

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={<Tag className="h-6 w-6" aria-hidden="true" />}
        title="Aucune prestation disponible"
        description="Aucune visite guidée n’est proposée pour le moment. Demandez conseil à Vanessa."
      />
    )
  }

  const book = (offerId: string) => {
    const target = ROUTES.book(offerId)
    requireAuth({ redirectTo: target, onSuccess: () => navigate(target) })
  }

  return (
    <ul className="space-y-3">
      {offers.map((offer) => (
        <li
          key={offer.$id}
          className="flex flex-col gap-4 rounded-3xl border border-sable-200 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="min-w-0 space-y-1.5">
            <h3 className="font-display text-lg font-bold text-sable-900">{offer.title}</h3>

            {showSite && offer.site && (
              <p className="text-sm text-sable-600">
                <Link
                  to={ROUTES.site(offer.site.slug)}
                  className="font-semibold text-primary-700 hover:underline"
                >
                  {offer.site.name}
                </Link>
                , {offer.site.city}
              </p>
            )}

            {showGuide && offer.guide && (
              <p className="text-sm text-sable-600">
                avec{' '}
                <Link
                  to={ROUTES.guide(offer.guide.slug)}
                  className="font-semibold text-primary-700 hover:underline"
                >
                  {offer.guide.fullName}
                </Link>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sable-500">
              {offer.durationMinutes ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {formatDuration(offer.durationMinutes)}
                </span>
              ) : null}
              {offer.languages.length > 0 && (
                <span className="flex items-center gap-1">
                  <Languages className="h-4 w-4" aria-hidden="true" />
                  {offer.languages.map((code) => SPOKEN_LANGUAGE_LABELS[code]).join(', ')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
            <div className="sm:text-right">
              <p className="font-display text-2xl font-bold text-sable-900">
                {formatPrice(offer.price, offer.currency)}
              </p>
              <p className="text-xs text-sable-500">
                {PRICING_TYPE_LABELS[offer.pricingType]}
                {offer.childPrice != null && offer.pricingType === 'per_person'
                  ? ` · enfant ${formatPrice(offer.childPrice, offer.currency, { free: true })}`
                  : ''}
              </p>
            </div>
            <Button onClick={() => book(offer.$id)}>Réserver</Button>
          </div>
        </li>
      ))}
    </ul>
  )
}