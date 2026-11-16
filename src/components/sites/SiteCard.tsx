// src/components/sites/SiteCard.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES, SITE_CATEGORY_LABELS } from '@/config/constants'
import { cn } from '@/lib/cn'
import { formatPrice } from '@/lib/format'
import { siteCoverUrl } from '@/services/storage.service'
import type { Site } from '@/types'

interface SiteCardProps {
  site: Site
  isFavorite?: boolean
  /** Si absent, le coeur des favoris n'est pas affiché */
  onToggleFavorite?: (siteId: string) => void
  className?: string
}

export function SiteCard({ site, isFavorite = false, onToggleFavorite, className }: SiteCardProps) {
  const cover = siteCoverUrl(site, { width: 640, height: 420 })

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-sable-200 bg-white shadow-card transition-shadow hover:shadow-lift',
        className,
      )}
    >
      <Link to={ROUTES.site(site.slug)} className="block">
        <div className="relative aspect-[3/2] overflow-hidden bg-primary-100">
          {cover ? (
            <img
              src={cover}
              alt={site.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-200 to-accent-200">
              <MapPin className="h-10 w-10 text-primary-700/60" aria-hidden="true" />
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-sable-800 backdrop-blur">
            {site.department}
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-display text-lg font-bold leading-snug text-sable-900">
              {site.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-sable-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {site.city}
            </p>
          </div>

          <p className="line-clamp-2 text-sm text-sable-600">{site.tagline || site.summary}</p>

          {site.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {site.categories.slice(0, 2).map((category) => (
                <Badge key={category} tone="primary">
                  {SITE_CATEGORY_LABELS[category]}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-sable-100 pt-3">
            {site.ratingCount > 0 ? (
              <Rating value={site.ratingAvg} count={site.ratingCount} size="sm" />
            ) : (
              <span className="text-xs text-sable-400">Pas encore d’avis</span>
            )}
            <span className="text-xs font-medium text-sable-600">
              {site.entranceFee > 0 ? `Entrée ${formatPrice(site.entranceFee)}` : 'Entrée libre'}
            </span>
          </div>
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={() => onToggleFavorite(site.$id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Retirer ${site.name} des favoris` : `Ajouter ${site.name} aux favoris`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur transition-transform hover:scale-110"
        >
          <Heart
            className={cn(
              'h-5 w-5',
              isFavorite ? 'fill-danger-600 text-danger-600' : 'text-sable-600',
            )}
            aria-hidden="true"
          />
        </button>
      )}
    </article>
  )
}

export function SiteCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-sable-200 bg-white" aria-hidden="true">
      <Skeleton className="aspect-[3/2] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}