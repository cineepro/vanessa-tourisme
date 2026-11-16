// src/components/articles/ArticleCard.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { BookOpenText, Clock } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { ARTICLE_TYPE_LABELS, ROUTES } from '@/config/constants'
import { cn } from '@/lib/cn'
import { articleCoverUrl } from '@/services/storage.service'
import type { Article } from '@/types'

export function ArticleCard({ article, className }: { article: Article; className?: string }) {
  const cover = articleCoverUrl(article, { width: 640, height: 360 })

  return (
    <Link
      to={ROUTES.article(article.slug)}
      className={cn(
        'group flex flex-col overflow-hidden rounded-3xl border border-sable-200 bg-white shadow-card transition-shadow hover:shadow-lift',
        className,
      )}
    >
      <div className="aspect-video overflow-hidden bg-accent-100">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent-100 to-primary-100">
            <BookOpenText className="h-10 w-10 text-primary-700/50" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Badge tone="accent" className="self-start">
          {ARTICLE_TYPE_LABELS[article.type]}
        </Badge>
        <h3 className="font-display text-lg font-bold leading-snug text-sable-900">{article.title}</h3>
        {article.excerpt && <p className="line-clamp-3 text-sm text-sable-600">{article.excerpt}</p>}
        {article.readingMinutes ? (
          <p className="mt-auto flex items-center gap-1 pt-2 text-xs text-sable-500">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {article.readingMinutes} min de lecture
          </p>
        ) : null}
      </div>
    </Link>
  )
}