import { listGuideReviews, listSiteReviews } from '@/services/reviews.service'
import { useAsync } from './useAsync'

export function useSiteReviews(siteId: string | undefined, limit = 10, offset = 0) {
  return useAsync(() => listSiteReviews(siteId as string, { limit, offset }), [siteId, limit, offset], {
    enabled: Boolean(siteId),
  })
}

export function useGuideReviews(guideId: string | undefined, limit = 10, offset = 0) {
  return useAsync(
    () => listGuideReviews(guideId as string, { limit, offset }),
    [guideId, limit, offset],
    { enabled: Boolean(guideId) },
  )
}