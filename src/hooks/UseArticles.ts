import type { ArticleFilters } from '@/types'
import { getArticleBySlug, getArticlesForSite, listArticles } from '@/services/articles.service'
import { useAsync } from './useAsync'

export function useArticles(filters: ArticleFilters = {}) {
  const key = JSON.stringify(filters)
  return useAsync(() => listArticles(filters), [key])
}

export function useArticle(slug: string | undefined) {
  return useAsync(() => getArticleBySlug(slug as string), [slug], { enabled: Boolean(slug) })
}

export function useSiteArticles(siteId: string | undefined, limit = 4) {
  return useAsync(() => getArticlesForSite(siteId as string, limit), [siteId, limit], {
    enabled: Boolean(siteId),
  })
}