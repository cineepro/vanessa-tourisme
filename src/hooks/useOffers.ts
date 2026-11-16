import {
  getOfferDetail,
  listAvailabilities,
  listSiteOffersWithGuides,
} from '@/services/offers.service'
import { useAsync } from './useAsync'

/** Offre avec son site et son guide (page de reservation). */
export function useOffer(offerId: string | undefined) {
  return useAsync(() => getOfferDetail(offerId as string), [offerId], {
    enabled: Boolean(offerId),
  })
}

/** Prestations et tarifs d'un site, chacune avec son guide. */
export function useSiteOffers(siteId: string | undefined) {
  return useAsync(() => listSiteOffersWithGuides(siteId as string), [siteId], {
    enabled: Boolean(siteId),
  })
}

/** Creneaux d'une offre sur une periode ("YYYY-MM-DD"). */
export function useAvailabilities(
  offerId: string | undefined,
  fromKey: string,
  toKey: string,
  enabled = true,
) {
  return useAsync(() => listAvailabilities(offerId as string, fromKey, toKey), [
    offerId,
    fromKey,
    toKey,
  ], { enabled: enabled && Boolean(offerId) })
}