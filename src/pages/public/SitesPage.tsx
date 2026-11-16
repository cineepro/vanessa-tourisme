// src/pages/public/SitesPage.tsx — Vanessa Tourisme
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { List, Map as MapIcon } from 'lucide-react'

import { Pagination } from '@/components/ui/Pagination'
import { SiteFilters } from '@/components/sites/SiteFilters'
import { SiteGrid } from '@/components/sites/SiteGrid'
import { SiteMap, type MapMarker } from '@/components/sites/SiteMap'
import {
  CLIMATE_LABELS,
  DEPARTMENTS,
  DIFFICULTY_LABELS,
  ENVIRONMENT_LABELS,
  ROUTES,
  SITE_CATEGORY_LABELS,
  VIBE_LABELS,
} from '@/config/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSites } from '@/hooks/useSites'
import { cn } from '@/lib/cn'
import type { Department, SiteFilters as Filters, SiteSort } from '@/types'

const PAGE_SIZE = 12

/* ------------------------------------------------------------
   Les filtres vivent dans l'URL : lien partageable, bouton retour fonctionnel.
   Chaque valeur est validée avant d'être envoyée à la base.
------------------------------------------------------------ */
function pickOne<T extends string>(raw: string | null, allowed: Record<T, string>): T | undefined {
  return raw && raw in allowed ? (raw as T) : undefined
}

function pickMany<T extends string>(raw: string | null, allowed: Record<T, string>): T[] | undefined {
  if (!raw) return undefined
  const values = raw.split(',').filter((value): value is T => value in allowed)
  return values.length > 0 ? values : undefined
}

function parseFilters(params: URLSearchParams): Filters {
  const department = params.get('dep')
  const month = Number(params.get('month'))
  const sort = params.get('sort')

  return {
    q: params.get('q')?.trim() || undefined,
    department: DEPARTMENTS.some((d) => d.value === department) ? (department as Department) : undefined,
    categories: pickMany(params.get('cat'), SITE_CATEGORY_LABELS),
    vibes: pickMany(params.get('vibe'), VIBE_LABELS),
    environments: pickMany(params.get('env'), ENVIRONMENT_LABELS),
    climateFeel: pickOne(params.get('climate'), CLIMATE_LABELS),
    difficulty: pickOne(params.get('diff'), DIFFICULTY_LABELS),
    familyFriendly: params.get('family') === '1' ? true : undefined,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
    sort: sort === 'rating' || sort === 'name' ? (sort as SiteSort) : undefined,
  }
}

function toParams(filters: Filters, page: number): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.department) params.set('dep', filters.department)
  if (filters.categories?.length) params.set('cat', filters.categories.join(','))
  if (filters.vibes?.length) params.set('vibe', filters.vibes.join(','))
  if (filters.environments?.length) params.set('env', filters.environments.join(','))
  if (filters.climateFeel) params.set('climate', filters.climateFeel)
  if (filters.difficulty) params.set('diff', filters.difficulty)
  if (filters.familyFriendly) params.set('family', '1')
  if (filters.month) params.set('month', String(filters.month))
  if (filters.sort && filters.sort !== 'recent') params.set('sort', filters.sort)
  if (page > 1) params.set('page', String(page))
  return params
}

export default function SitesPage() {
  useDocumentTitle('Sites touristiques du Bénin')

  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<'list' | 'map'>('list')

  const paramsKey = params.toString()
  const filters = useMemo(() => parseFilters(params), [paramsKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const page = Math.max(1, Number(params.get('page')) || 1)

  const { data, isLoading, error, reload } = useSites({
    ...filters,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const markers = useMemo<MapMarker[]>(
    () =>
      (data?.documents ?? []).map((site) => ({
        id: site.$id,
        lat: site.latitude,
        lng: site.longitude,
        title: site.name,
        subtitle: `${site.city}, ${site.department}`,
        href: ROUTES.site(site.slug),
      })),
    [data],
  )

  const changeFilters = (next: Filters) => setParams(toParams(next, 1))
  const changePage = (nextPage: number) => {
    setParams(toParams(filters, nextPage))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold text-sable-900 sm:text-4xl">Les sites touristiques du Bénin</h1>
        <p className="mt-2 text-sable-600">
          Filtrez par ambiance, cadre ou période, ou laissez Vanessa choisir pour vous.
        </p>
      </header>

      <SiteFilters value={filters} onChange={changeFilters} className="mt-6" />

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-sable-600" aria-live="polite">
          {data ? `${data.total} site${data.total > 1 ? 's' : ''}` : 'Chargement…'}
        </p>

        <div className="flex rounded-full border border-sable-300 bg-white p-1" role="group" aria-label="Affichage">
          {(
            [
              { key: 'list', label: 'Liste', icon: List },
              { key: 'map', label: 'Carte', icon: MapIcon },
            ] as const
          ).map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setView(option.key)}
                aria-pressed={view === option.key}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  view === option.key ? 'bg-primary-600 text-white' : 'text-sable-700 hover:bg-sable-100',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        {view === 'map' && markers.length > 0 ? (
          <SiteMap markers={markers} height={520} />
        ) : (
          <SiteGrid
            sites={data?.documents}
            isLoading={isLoading}
            error={error}
            onRetry={reload}
            skeletonCount={PAGE_SIZE / 2}
          />
        )}
      </div>

      <Pagination
        page={page}
        total={data?.total ?? 0}
        pageSize={PAGE_SIZE}
        onChange={changePage}
        className="mt-10"
      />
    </div>
  )
}