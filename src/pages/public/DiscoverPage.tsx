// src/pages/public/DiscoverPage.tsx — Vanessa Tourisme
import { useSearchParams } from 'react-router-dom'
import { BookOpenText } from 'lucide-react'

import { ArticleCard } from '@/components/articles/ArticleCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { ARTICLE_TYPE_LABELS } from '@/config/constants'
import { useArticles } from '@/hooks/useArticles'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import type { ArticleType } from '@/types'

const PAGE_SIZE = 9

/** Rubriques de lecture (les infos pratiques et la FAQ ont leur propre page). */
const TYPES: ArticleType[] = ['culture', 'history', 'vodun', 'customs', 'food', 'blog']

export default function DiscoverPage() {
  useDocumentTitle('Culture et histoire du Bénin')

  const [params, setParams] = useSearchParams()
  const typeParam = params.get('type')
  const type = TYPES.find((item) => item === typeParam)
  const page = Math.max(1, Number(params.get('page')) || 1)

  const { data, isLoading, error, reload } = useArticles({
    type,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const select = (next: ArticleType | null) => {
    const nextParams = new URLSearchParams()
    if (next) nextParams.set('type', next)
    setParams(nextParams)
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold text-sable-900 sm:text-4xl">Comprendre le Bénin</h1>
        <p className="mt-2 text-sable-600">
          Histoire, vodun, coutumes, cuisine : arrivez mieux préparé, plus curieux et plus respectueux.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {[null, ...TYPES].map((item) => (
          <button
            key={item ?? 'all'}
            type="button"
            onClick={() => select(item)}
            aria-pressed={type === (item ?? undefined)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              type === (item ?? undefined)
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-sable-300 bg-white text-sable-700 hover:bg-sable-100',
            )}
          >
            {item ? ARTICLE_TYPE_LABELS[item] : 'Tout'}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {isLoading && !data ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Impossible de charger les articles"
            description={error}
            action={
              <button type="button" onClick={reload} className="font-semibold text-primary-700 hover:underline">
                Réessayer
              </button>
            }
          />
        ) : !data || data.documents.length === 0 ? (
          <EmptyState
            icon={<BookOpenText className="h-6 w-6" aria-hidden="true" />}
            title="Rien à lire pour le moment"
            description="De nouveaux articles arrivent bientôt. En attendant, posez vos questions à Vanessa."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.documents.map((article) => (
              <ArticleCard key={article.$id} article={article} />
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        total={data?.total ?? 0}
        pageSize={PAGE_SIZE}
        onChange={(nextPage) => {
          const next = new URLSearchParams(params)
          next.set('page', String(nextPage))
          setParams(next)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        className="mt-10"
      />
    </div>
  )
}