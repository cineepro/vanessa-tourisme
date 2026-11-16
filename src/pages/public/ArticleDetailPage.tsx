// src/pages/public/ArticleDetailPage.tsx — Vanessa Tourisme
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Clock, MessageCircle } from 'lucide-react'

import { ArticleContent } from '@/components/articles/ArticleContent'
import { SiteGrid } from '@/components/sites/SiteGrid'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClasses } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { ARTICLE_TYPE_LABELS, ROUTES } from '@/config/constants'
import { useArticle } from '@/hooks/useArticles'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { formatDate } from '@/lib/format'
import { articleCoverUrl } from '@/services/storage.service'
import { getSitesByIds } from '@/services/sites.service'

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const requireAuth = useRequireAuth()

  const { data: article, isLoading, error } = useArticle(slug)
  useDocumentTitle(article?.title)

  const { data: sites } = useAsync(
    () => getSitesByIds(article!.relatedSiteIds),
    [article?.relatedSiteIds.join(',')],
    { enabled: Boolean(article) && (article?.relatedSiteIds.length ?? 0) > 0 },
  )

  if (isLoading && !article) {
    return (
      <div className="container-page max-w-3xl space-y-6 py-8" aria-hidden="true">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="aspect-video w-full rounded-3xl" />
        <SkeletonText lines={6} />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Article introuvable"
          description={error ?? 'Cet article n’existe pas ou n’est plus disponible.'}
          action={
            <Link to={ROUTES.discover} className={buttonClasses({ variant: 'outline' })}>
              Retour aux articles
            </Link>
          }
        />
      </div>
    )
  }

  const cover = articleCoverUrl(article, { width: 1400 })

  const askVanessa = () => {
    const question = `Peux-tu m’en dire plus sur : ${article.title} ?`
    const target = `${ROUTES.chat}?mode=culture&q=${encodeURIComponent(question)}`
    requireAuth({ redirectTo: target, onSuccess: () => navigate(target) })
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Fil d’Ariane" className="mb-4 flex items-center gap-1 text-sm text-sable-500">
          <Link to={ROUTES.discover} className="hover:text-primary-700">
            Culture
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="truncate text-sable-800">{article.title}</span>
        </nav>

        <header className="space-y-3">
          <Badge tone="accent">{ARTICLE_TYPE_LABELS[article.type]}</Badge>
          <h1 className="text-3xl font-extrabold leading-tight text-sable-900 sm:text-5xl">{article.title}</h1>
          <p className="flex flex-wrap items-center gap-x-4 text-sm text-sable-500">
            {article.authorName && <span>Par {article.authorName}</span>}
            {article.publishedAt && <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, 'long')}</time>}
            {article.readingMinutes ? (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {article.readingMinutes} min de lecture
              </span>
            ) : null}
          </p>
        </header>

        {cover && <img src={cover} alt="" className="mt-6 w-full rounded-3xl object-cover" />}

        {article.excerpt && <p className="mt-6 text-xl text-sable-600">{article.excerpt}</p>}

        <div className="mt-8">
          <ArticleContent content={article.content} />
        </div>

        {article.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
        )}

        <aside className="mt-10 flex flex-col items-start gap-4 rounded-3xl bg-primary-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-primary-900">Une question sur ce sujet ?</h2>
            <p className="text-sm text-primary-800">Vanessa y répond comme quelqu’un qui connaît le pays.</p>
          </div>
          <Button onClick={askVanessa} leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}>
            Demander à Vanessa
          </Button>
        </aside>
      </article>

      {sites && sites.length > 0 && (
        <section aria-labelledby="related-sites" className="mt-14 space-y-5">
          <h2 id="related-sites" className="text-2xl font-bold text-sable-900">
            Sites à découvrir
          </h2>
          <SiteGrid sites={sites} />
        </section>
      )}
    </div>
  )
}