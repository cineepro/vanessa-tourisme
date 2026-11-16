// src/components/home/FeaturedSites.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { SiteGrid } from '@/components/sites/SiteGrid'
import { ROUTES } from '@/config/constants'
import { useFeaturedSites } from '@/hooks/useSites'

/** Les sites mis en avant. Masquée s'il n'y en a aucun (et qu'il n'y a pas d'erreur). */
export function FeaturedSites() {
  const { data, isLoading, error, reload } = useFeaturedSites(6)

  if (!isLoading && !error && data && data.length === 0) return null

  return (
    <section className="section bg-white" aria-labelledby="featured-title">
      <div className="container-page">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="featured-title" className="text-3xl font-bold text-sable-900 sm:text-4xl">
              Les incontournables
            </h2>
            <p className="mt-2 text-sable-600">Les sites que les voyageurs adorent.</p>
          </div>
          <Link
            to={ROUTES.sites}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:underline"
          >
            Voir tous les sites
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <SiteGrid sites={data} isLoading={isLoading} error={error} onRetry={reload} />
      </div>
    </section>
  )
}