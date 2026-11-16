// src/services/articles.service.ts — Vanessa Tourisme
import { COLLECTIONS } from '@/config/appwrite-ids'
import { AppError, listDocuments, Query } from '@/lib/appwrite'
import type { Article, ArticleFilters, ArticleType, ListResult } from '@/types'

export function listArticles(filters: ArticleFilters = {}): Promise<ListResult<Article>> {
  const queries: string[] = [Query.equal('status', 'published')]

  if (filters.type) queries.push(Query.equal('type', filters.type))
  if (filters.language) queries.push(Query.equal('language', filters.language))
  const term = filters.q?.trim()
  if (term) {
    queries.push(Query.search('title', term))
  }

  queries.push(Query.orderDesc('publishedAt'))
  queries.push(Query.limit(filters.limit ?? 12))
  queries.push(Query.offset(filters.offset ?? 0))
  return listDocuments<Article>(COLLECTIONS.articles, queries)
}

export async function getArticleBySlug(slug: string): Promise<Article> {
  const { documents } = await listDocuments<Article>(COLLECTIONS.articles, [
    Query.equal('slug', slug),
    Query.equal('status', 'published'),
    Query.limit(1),
  ])
  if (documents.length === 0) throw new AppError('Cet article est introuvable.', 'NOT_FOUND', 404)
  return documents[0]
}

export async function getArticlesByType(type: ArticleType, limit = 20): Promise<Article[]> {
  const { documents } = await listArticles({ type, limit })
  return documents
}

/** Articles lies a un site (fiche site : "pour aller plus loin"). */
export async function getArticlesForSite(siteId: string, limit = 4): Promise<Article[]> {
  const { documents } = await listDocuments<Article>(COLLECTIONS.articles, [
    Query.equal('status', 'published'),
    Query.contains('relatedSiteIds', [siteId]),
    Query.orderDesc('publishedAt'),
    Query.limit(limit),
  ])
  return documents
}

export function getFaq(limit = 50): Promise<Article[]> {
  return getArticlesByType('faq', limit)
}