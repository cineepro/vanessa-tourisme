// src/pages/public/GuideDetailPage.tsx — Vanessa Tourisme
import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { GuideProfile } from '@/components/guides/GuideProfile'
import { PriceTable } from '@/components/guides/PriceTable'
import { ReviewList } from '@/components/reviews/ReviewList'
import { SiteGrid } from '@/components/sites/SiteGrid'
import { buttonClasses } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { ROUTES } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useGuide } from '@/hooks/useGuides'
import { listOffers } from '@/services/offers.service'
import { getSitesByIds } from '@/services/sites.service'
import type { OfferDetail } from '@/types'

export default function GuideDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: guide, isLoading, error } = useGuide(slug)
  useDocumentTitle(guide?.fullName)

  // Prestations du guide, chacune avec son site
  const { data: offers } = useAsync<OfferDetail[]>(
    async () => {
      const { documents } = await listOffers({ guideId: guide!.$id })
      const sites = await getSitesByIds(documents.map((offer) => offer.siteId))
      const bySiteId = new Map(sites.map((site) => [site.$id, site]))
      return documents.map((offer) => ({ ...offer, guide, site: bySiteId.get(offer.siteId) }))
    },
    [guide?.$id],
    { enabled: Boolean(guide) },
  )

  const { data: sites } = useAsync(() => getSitesByIds(guide!.siteIds), [guide?.siteIds.join(',')], {
    enabled: Boolean(guide) && (guide?.siteIds.length ?? 0) > 0,
  })

  if (isLoading && !guide) {
    return (
      <div className="container-page space-y-6 py-8" aria-hidden="true">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <SkeletonText lines={4} />
      </div>
    )
  }

  if (error || !guide) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Guide introuvable"
          description={error ?? 'Ce guide n’existe pas ou n’est plus disponible.'}
          action={
            <Link to={ROUTES.guides} className={buttonClasses({ variant: 'outline' })}>
              Voir tous les guides
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-page space-y-12 py-6 sm:py-10">
      <div>
        <nav aria-label="Fil d’Ariane" className="mb-4 flex items-center gap-1 text-sm text-sable-500">
          <Link to={ROUTES.guides} className="hover:text-primary-700">
            Guides
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="truncate text-sable-800">{guide.fullName}</span>
        </nav>
        <GuideProfile guide={guide} />
      </div>

      <section aria-labelledby="offers-title" className="space-y-4">
        <h2 id="offers-title" className="text-2xl font-bold text-sable-900">
          Prestations et tarifs
        </h2>
        <PriceTable offers={offers ?? []} showGuide={false} showSite />
      </section>

      {sites && sites.length > 0 && (
        <section aria-labelledby="sites-title" className="space-y-4">
          <h2 id="sites-title" className="text-2xl font-bold text-sable-900">
            Sites couverts
          </h2>
          <SiteGrid sites={sites} />
        </section>
      )}

      <section aria-labelledby="reviews-title" className="space-y-4">
        <h2 id="reviews-title" className="text-2xl font-bold text-sable-900">
          Avis des voyageurs
        </h2>
        <ReviewList guideId={guide.$id} />
      </section>
    </div>
  )
}