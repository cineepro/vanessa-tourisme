// src/components/chat/SuggestedSites.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

import { PlaceCard } from '@/components/places/PlaceCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { getPlacesByIds } from '@/services/places.service'
import { getSitesByIds } from '@/services/sites.service'
import { siteCoverUrl } from '@/services/storage.service'

/** Sites recommandés par Vanessa, affichés sous sa réponse. */
export function SuggestedSites({ ids }: { ids: string[] }) {
  const key = ids.join(',')
  const { data: sites, isLoading } = useAsync(() => getSitesByIds(ids), [key], {
    enabled: ids.length > 0,
  })

  if (isLoading && !sites) {
    return (
      <div className="flex gap-2" aria-hidden="true">
        <Skeleton className="h-20 w-56 rounded-2xl" />
        <Skeleton className="h-20 w-56 rounded-2xl" />
      </div>
    )
  }

  if (!sites || sites.length === 0) return null

  return (
    <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Sites suggérés">
      {sites.map((site) => {
        const cover = siteCoverUrl(site, { width: 160, height: 160 })
        return (
          <li key={site.$id} className="shrink-0">
            <Link
              to={ROUTES.site(site.slug)}
              className="flex w-60 items-center gap-3 rounded-2xl border border-sable-200 bg-white p-2 shadow-sm transition-shadow hover:shadow-card"
            >
              {cover ? (
                <img src={cover} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                  <MapPin className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-sable-900">{site.name}</span>
                <span className="block truncate text-xs text-sable-500">
                  {site.city}, {site.department}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-primary-700">Voir la fiche</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Lieux (santé, restauration...) suggérés par Vanessa pendant le séjour. */
export function SuggestedPlaces({ ids }: { ids: string[] }) {
  const key = ids.join(',')
  const { data: places } = useAsync(() => getPlacesByIds(ids), [key], {
    enabled: ids.length > 0,
  })

  if (!places || places.length === 0) return null

  return (
    <ul className="space-y-2" aria-label="Lieux suggérés">
      {places.map((place) => (
        <li key={place.$id}>
          <PlaceCard place={place} compact />
        </li>
      ))}
    </ul>
  )
}