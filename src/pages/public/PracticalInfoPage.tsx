// src/pages/public/PracticalInfoPage.tsx — Vanessa Tourisme
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, MessageCircle } from 'lucide-react'

import { ArticleContent } from '@/components/articles/ArticleContent'
import { NearbyList } from '@/components/places/NearbyList'
import { EmergencyBar } from '@/components/places/EmergencyBar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES } from '@/config/constants'
import { useArticles } from '@/hooks/useArticles'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import type { Article } from '@/types'

function ArticleLinks({ articles }: { articles: Article[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {articles.map((article) => (
        <li key={article.$id}>
          <Link
            to={ROUTES.article(article.slug)}
            className="block h-full rounded-2xl border border-sable-200 bg-white p-4 shadow-card transition-shadow hover:shadow-lift"
          >
            <h3 className="font-display text-base font-bold text-sable-900">{article.title}</h3>
            {article.excerpt && <p className="mt-1 line-clamp-2 text-sm text-sable-600">{article.excerpt}</p>}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function PracticalInfoPage() {
  useDocumentTitle('Infos pratiques')

  const navigate = useNavigate()
  const requireAuth = useRequireAuth()

  const practical = useArticles({ type: 'practical', limit: 20 })
  const safety = useArticles({ type: 'safety', limit: 20 })
  const faq = useArticles({ type: 'faq', limit: 50 })

  const askVanessa = () => {
    const target = `${ROUTES.chat}?mode=general`
    requireAuth({ redirectTo: target, onSuccess: () => navigate(target) })
  }

  return (
    <div className="container-page space-y-12 py-8 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold text-sable-900 sm:text-4xl">Infos pratiques</h1>
        <p className="mt-2 text-sable-600">
          Tout ce qu’il faut savoir pour préparer son voyage sereinement et réserver en confiance.
        </p>
      </header>

      <EmergencyBar />

      {practical.isLoading && !practical.data ? (
        <Skeleton className="h-32 w-full rounded-3xl" />
      ) : (
        practical.data &&
        practical.data.documents.length > 0 && (
          <section aria-labelledby="practical-title" className="space-y-4">
            <h2 id="practical-title" className="text-2xl font-bold text-sable-900">
              Préparer son voyage
            </h2>
            <ArticleLinks articles={practical.data.documents} />
          </section>
        )
      )}

      {safety.data && safety.data.documents.length > 0 && (
        <section aria-labelledby="safety-title" className="space-y-4">
          <h2 id="safety-title" className="text-2xl font-bold text-sable-900">
            Santé et sécurité
          </h2>
          <ArticleLinks articles={safety.data.documents} />
        </section>
      )}

      <section aria-labelledby="nearby-title" className="space-y-4">
        <h2 id="nearby-title" className="text-2xl font-bold text-sable-900">
          Près de vous
        </h2>
        <p className="text-sable-600">Pharmacies, restaurants, sorties : trouvez ce qu’il y a autour de vous.</p>
        <NearbyList />
      </section>

      {faq.data && faq.data.documents.length > 0 && (
        <section aria-labelledby="faq-title" className="space-y-4">
          <h2 id="faq-title" className="text-2xl font-bold text-sable-900">
            Questions fréquentes
          </h2>
          <div className="divide-y divide-sable-200 overflow-hidden rounded-3xl border border-sable-200 bg-white">
            {faq.data.documents.map((item) => (
              <details key={item.$id} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-sable-900 hover:bg-sable-50">
                  {item.title}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-sable-500 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="px-5 pb-5 text-base">
                  <ArticleContent content={item.content} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <aside className="flex flex-col items-start gap-4 rounded-3xl bg-primary-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-primary-900">Vous ne trouvez pas votre réponse ?</h2>
          <p className="text-sm text-primary-800">Vanessa répond à vos questions, à toute heure.</p>
        </div>
        <Button onClick={askVanessa} leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}>
          Demander à Vanessa
        </Button>
      </aside>
    </div>
  )
}