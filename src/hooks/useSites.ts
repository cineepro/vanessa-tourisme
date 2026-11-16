import type { LatLng, Site, SiteFilters } from '@/types'
import {
  getFeaturedSites,
  getNearbySites,
  getRelatedSites,
  getSiteBySlug,
  listSites,
} from '@/services/sites.service'
import { useAsync } from './useAsync'

/** Liste filtree et paginee. */
export function useSites(filters: SiteFilters = {}) {
  const key = JSON.stringify(filters)
  return useAsync(() => listSites(filters), [key])
}

/** Fiche d'un site par son slug (URL). */
export function useSite(slug: string | undefined) {
  return useAsync(() => getSiteBySlug(slug as string), [slug], { enabled: Boolean(slug) })
}

export function useFeaturedSites(limit = 6) {
  return useAsync(() => getFeaturedSites(limit), [limit])
}

export function useRelatedSites(site: Site | undefined, limit = 4) {
  return useAsync(() => getRelatedSites(site as Site, limit), [site?.$id, limit], {
    enabled: Boolean(site),
  })
}

export function useNearbySites(position: LatLng | null, radiusKm = 50, limit = 12) {
  return useAsync(() => getNearbySites(position as LatLng, radiusKm, limit), [
    position ? position.lat.toFixed(3) : null,
    position ? position.lng.toFixed(3) : null,
    radiusKm,
    limit,
  ], { enabled: Boolean(position) })
}