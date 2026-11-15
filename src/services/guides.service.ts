import { COLLECTIONS } from '@/config/appwrite-ids'
import { AppError, getDocument, listDocuments, Query } from '@/lib/appwrite'
import type { Guide, GuideFilters, ListResult } from '@/types'

const PAGE_SIZE = 12

function buildGuideQueries(filters: GuideFilters = {}): string[] {
  const queries: string[] = [Query.equal('status', 'active')]

  if (filters.siteId) queries.push(Query.contains('siteIds', [filters.siteId]))
  if (filters.language) queries.push(Query.contains('languages', [filters.language]))
  if (filters.certified) queries.push(Query.equal('certified', true))
  if (filters.agencyId) queries.push(Query.equal('agencyId', filters.agencyId))

  const term = filters.q?.trim()
  if (term) queries.push(Query.search('fullName', term))

  queries.push(Query.orderDesc('ratingAvg'))
  queries.push(Query.limit(filters.limit ?? PAGE_SIZE))
  queries.push(Query.offset(filters.offset ?? 0))
  return queries
}

export function listGuides(filters: GuideFilters = {}): Promise<ListResult<Guide>> {
  return listDocuments<Guide>(COLLECTIONS.guides, buildGuideQueries(filters))
}

export async function getGuideBySlug(slug: string): Promise<Guide> {
  const { documents } = await listDocuments<Guide>(COLLECTIONS.guides, [
    Query.equal('slug', slug),
    Query.equal('status', 'active'),
    Query.limit(1),
  ])
  if (documents.length === 0) throw new AppError('Ce guide est introuvable.', 'NOT_FOUND', 404)
  return documents[0]
}

export function getGuideById(id: string): Promise<Guide> {
  return getDocument<Guide>(COLLECTIONS.guides, id)
}

export async function getGuidesByIds(ids: string[]): Promise<Guide[]> {
  const unique = [...new Set(ids)].slice(0, 100)
  if (unique.length === 0) return []

  const { documents } = await listDocuments<Guide>(COLLECTIONS.guides, [
    Query.equal('$id', unique),
    Query.limit(unique.length),
  ])
  return documents
}

/** Guides actifs qui couvrent un site. */
export async function getGuidesBySite(siteId: string, limit = 20): Promise<Guide[]> {
  const { documents } = await listGuides({ siteId, limit })
  return documents
}