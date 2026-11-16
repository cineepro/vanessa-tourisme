// src/pages/account/BookPage.tsx — Vanessa Tourisme
import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { BookingForm } from '@/components/booking/BookingForm'
import { buttonClasses } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES } from '@/config/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useOffer } from '@/hooks/useOffers'
import { toast } from '@/store/ui.store'

export default function BookPage() {
  const { offerId } = useParams<{ offerId: string }>()
  const { data: offer, isLoading, error } = useOffer(offerId)

  useDocumentTitle(offer ? `Réserver : ${offer.title}` : 'Réserver')

  if (isLoading && !offer) {
    return (
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_360px]" aria-hidden="true">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    )
  }

  if (error || !offer || !offer.isActive) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Cette prestation n’est plus disponible"
          description={error ?? 'Elle a peut-être été retirée par l’agence. Consultez les autres visites proposées.'}
          action={
            <Link to={ROUTES.sites} className={buttonClasses({ variant: 'outline' })}>
              Voir les sites
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <nav aria-label="Fil d’Ariane" className="mb-5 flex items-center gap-1 text-sm text-sable-500">
        {offer.site ? (
          <>
            <Link to={ROUTES.site(offer.site.slug)} className="hover:text-primary-700">
              {offer.site.name}
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </>
        ) : null}
        <span className="text-sable-800">Réservation</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-sable-900">Réserver : {offer.title}</h1>

      <BookingForm
        offer={offer}
        onDone={(booking) =>
          toast.success(
            booking.status === 'confirmed' ? 'Réservation confirmée' : 'Demande envoyée',
            `Référence ${booking.reference}`,
          )
        }
      />
    </div>
  )
}