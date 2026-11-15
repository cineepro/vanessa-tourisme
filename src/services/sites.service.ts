import { COLLECTIONS } from '@/config/appwrite-ids'
import { AppError, anyOf, geohashQuery, getDocument, listDocuments, Query } from '@/lib/appwrite'
import { geohashPrefixesForRadius, sortByDistance } from '@/lib/geo'
import type { LatLng, ListResult, Site, SiteFilters } from '@/types'

const PAGE_SIZE = 12

function buildSiteQueries(filters: SiteFilters = {}): string[] {
  const queries: string[] = [Query.equal('status', 'published')]

  if (filters.department) queries.push(Query.equal('department', filters.department))
  if (filters.categories?.length) queries.push(Query.contains('categories', filters.categories))
  if (filters.vibes?.length) queries.push(Query.contains('vibes', filters.vibes))
  if (filters.environments?.length) {
    queries.push(Query.contains('environments', filters.environments))
  }
  if (filters.climateFeel) queries.push(Query.equal('climateFeel', filters.climateFeel))
  if (filters.difficulty) queries.push(Query.equal('difficulty', filters.difficulty))
  if (filters.budgetLevel) queries.push(Query.equal('budgetLevel', filters.budgetLevel))
  if (filters.familyFriendly) queries.push(Query.equal('familyFriendly', true))
  if (filters.featured) queries.push(Query.equal('featured', true))
  if (filters.month) queries.push(Query.contains('bestMonths', [filters.month]))

  const term = filters.q?.trim()
  if (term) {
    queries.push(anyOf([Query.search('name', term), Query.search('summary', term)]))
  }

  const ascending = filters.sortDirection === 'asc'
  switch (filters.sort) {
    case 'rating':
      queries.push(ascending ? Query.orderAsc('ratingAvg') : Query.orderDesc('ratingAvg'))
      break
    case 'name':
      queries.push(ascending || !filters.sortDirection ? Query.orderAsc('name') : Query.orderDesc('name'))
      break
    default:
      queries.push(ascending ? Query.orderAsc('$createdAt') : Query.orderDesc('$createdAt'))
  }

  queries.push(Query.limit(filters.limit ?? PAGE_SIZE))
  queries.push(Query.offset(filters.offset ?? 0))
  return queries
}

export function listSites(filters: SiteFilters = {}): Promise<ListResult<Site>> {
  return listDocuments<Site>(COLLECTIONS.sites, buildSiteQueries(filters))
}

export async function getSiteBySlug(slug: string): Promise<Site> {
  const { documents } = await listDocuments<Site>(COLLECTIONS.sites, [
    Query.equal('slug', slug),
    Query.equal('status', 'published'),
    Query.limit(1),
  ])
  if (documents.length === 0) throw new AppError('Ce site est introuvable.', 'NOT_FOUND', 404)
  return documents[0]
}

export function getSiteById(id: string): Promise<Site> {
  return getDocument<Site>(COLLECTIONS.sites, id)
}

/** Garde l'ordre des IDs demandes. */
export async function getSitesByIds(ids: string[]): Promise<Site[]> {
  const unique = [...new Set(ids)].slice(0, 100)
  if (unique.length === 0) return []

  const { documents } = await listDocuments<Site>(COLLECTIONS.sites, [
    Query.equal('$id', unique),
    Query.equal('status', 'published'),
    Query.limit(unique.length),
  ])
  const byId = new Map(documents.map((site) => [site.$id, site]))
  return unique.map((id) => byId.get(id)).filter((site): site is Site => Boolean(site))
}

export async function getFeaturedSites(limit = 6): Promise<Site[]> {
  const { documents } = await listSites({ featured: true, sort: 'rating', limit })
  return documents
}

/** Sites du meme departement ou partageant une categorie. */
export async function getRelatedSites(site: Site, limit = 4): Promise<Site[]> {
  const similar = [Query.equal('department', site.department)]
  if (site.categories.length > 0) similar.push(Query.contains('categories', site.categories))

  const { documents } = await listDocuments<Site>(COLLECTIONS.sites, [
    Query.equal('status', 'published'),
    Query.notEqual('$id', site.$id),
    anyOf(similar),
    Query.orderDesc('ratingAvg'),
    Query.limit(limit),
  ])
  return documents
}

/** Sites publies autour d'une position, tries du plus proche au plus loin. */
export async function getNearbySites(
  position: LatLng,
  radiusKm = 50,
  limit = 12,
): Promise<(Site & { distanceKm: number })[]> {
  const { prefixes } = geohashPrefixesForRadius(position, radiusKm)
  const { documents } = await listDocuments<Site>(COLLECTIONS.sites, [
    Query.equal('status', 'published'),
    geohashQuery(prefixes),
    Query.limit(100),
  ])

  return sortByDistance(documents, position)
    .filter((site) => site.distanceKm <= radiusKm)
    .slice(0, limit)
}