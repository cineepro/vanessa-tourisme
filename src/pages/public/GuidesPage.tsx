// src/pages/public/GuidesPage.tsx — Vanessa Tourisme
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Users } from 'lucide-react'

import { GuideCard } from '@/components/guides/GuideCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { SPOKEN_LANGUAGE_LABELS, toOptions } from '@/config/constants'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useGuides } from '@/hooks/useGuides'
import type { SpokenLanguage } from '@/types'

const PAGE_SIZE = 12

export default function GuidesPage() {
  useDocumentTitle('Guides touristiques')

  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const languageParam = params.get('lang')
  const language =
    languageParam && languageParam in SPOKEN_LANGUAGE_LABELS ? (languageParam as SpokenLanguage) : undefined
  const certified = params.get('certified') === '1'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const [term, setTerm] = useState(q)
  const debounced = useDebounce(term, 350)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    })
    next.delete('page')
    setParams(next)
  }

  useEffect(() => {
    const next = debounced.trim()
    if (next !== q) update({ q: next })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const { data, isLoading, error, reload } = useGuides({
    q: q || undefined,
    language,
    certified: certified || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold text-sable-900 sm:text-4xl">Nos guides touristiques</h1>
        <p className="mt-2 text-sable-600">
          Des guides passionnés qui connaissent leur région, leurs tarifs affichés clairement.
        </p>
      </header>

      <div className="mt-6 grid gap-3 rounded-3xl border border-sable-200 bg-white p-4 sm:grid-cols-[1fr_200px_auto] sm:items-center">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sable-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Rechercher un guide…"
            aria-label="Rechercher un guide"
            className="h-11 w-full rounded-full border border-sable-300 pl-11 pr-4 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        <select
          value={language ?? ''}
          onChange={(event) => update({ lang: event.target.value })}
          aria-label="Langue parlée"
          className="h-11 rounded-full border border-sable-300 bg-white px-4 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        >
          <option value="">Toutes les langues</option>
          {toOptions(SPOKEN_LANGUAGE_LABELS).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm font-medium text-sable-800">
          <input
            type="checkbox"
            checked={certified}
            onChange={(event) => update({ certified: event.target.checked ? '1' : null })}
            className="h-4 w-4 accent-primary-600"
          />
          Guides agréés
        </label>
      </div>

      <div className="mt-8">
        {isLoading && !data ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-32 rounded-3xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Impossible de charger les guides"
            description={error}
            action={
              <button type="button" onClick={reload} className="font-semibold text-primary-700 hover:underline">
                Réessayer
              </button>
            }
          />
        ) : !data || data.documents.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden="true" />}
            title="Aucun guide trouvé"
            description="Essayez de modifier votre recherche."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.documents.map((guide) => (
              <GuideCard key={guide.$id} guide={guide} />
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