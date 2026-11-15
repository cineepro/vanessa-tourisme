import type { BaseDoc, Language, PublishStatus } from './index'

export type ArticleType =
  | 'culture'
  | 'history'
  | 'vodun'
  | 'customs'
  | 'practical'
  | 'safety'
  | 'food'
  | 'faq'
  | 'blog'

/** Collection `tour_articles` : culture, histoire, infos pratiques, FAQ */
export interface Article extends BaseDoc {
  type: ArticleType
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverId: string | null
  authorName: string | null
  language: Language
  tags: string[]
  relatedSiteIds: string[]
  readingMinutes: number | null
  status: PublishStatus
  publishedAt: string | null
}

export interface ArticleFilters {
  q?: string
  type?: ArticleType
  language?: Language
  limit?: number
  offset?: number
}