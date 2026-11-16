// src/components/sites/SiteGrid.tsx — Vanessa Tourisme
import { CircleAlert, Compass } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFavorites } from '@/hooks/useFavorites'
import { cn } from '@/lib/cn'
import type { Site } from '@/types'
import { SiteCard, SiteCardSkeleton } from './SiteCard'

interface SiteGridProps {
  sites: Site[] | undefined
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  skeletonCount?: number
  emptyTitle?: string
  emptyDescription?: string
  /** Nombre de colonnes maximum sur grand écran */
  columns?: 2 | 3 | 4
  className?: string
}

const columnClass = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
} as const

/** Grille de sites avec chargement, erreur, état vide et favoris intégrés. */
export function SiteGrid({
  sites,
  isLoading = false,
  error,
  onRetry,
  skeletonCount = 6,
  emptyTitle = 'Aucun site trouvé',
  emptyDescription = 'Essayez de modifier vos filtres ou demandez conseil à Vanessa.',
  columns = 3,
  className,
}: SiteGridProps) {
  const { isFavorite, toggle } = useFavorites('site')
  const grid = cn('grid gap-5', columnClass[columns], className)

  if (isLoading && !sites) {
    return (
      <div className={grid}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <SiteCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={<CircleAlert className="h-6 w-6" aria-hidden="true" />}
        title="Impossible de charger les sites"
        description={error}
        action={
          onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Réessayer
            </Button>
          )
        }
      />
    )
  }

  if (!sites || sites.length === 0) {
    return (
      <EmptyState
        icon={<Compass className="h-6 w-6" aria-hidden="true" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className={cn(grid, isLoading && 'opacity-60 transition-opacity')}>
      {sites.map((site) => (
        <SiteCard
          key={site.$id}
          site={site}
          isFavorite={isFavorite(site.$id)}
          onToggleFavorite={toggle}
        />
      ))}
    </div>
  )
}