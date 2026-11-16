import type { GuideFilters } from '@/types'
import { getGuideBySlug, getGuidesBySite, listGuides } from '@/services/guides.service'
import { useAsync } from './useAsync'

export function useGuides(filters: GuideFilters = {}) {
  const key = JSON.stringify(filters)
  return useAsync(() => listGuides(filters), [key])
}

export function useGuide(slug: string | undefined) {
  return useAsync(() => getGuideBySlug(slug as string), [slug], { enabled: Boolean(slug) })
}

export function useSiteGuides(siteId: string | undefined) {
  return useAsync(() => getGuidesBySite(siteId as string), [siteId], { enabled: Boolean(siteId) })
}