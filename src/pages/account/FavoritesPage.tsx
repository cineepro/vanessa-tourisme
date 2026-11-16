// src/pages/account/FavoritesPage.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

import { SiteCard, SiteCardSkeleton } from '@/components/sites/SiteCard'
import { buttonClasses } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ROUTES } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFavorites } from '@/hooks/useFavorites'
import { getSitesByIds } from '@/services/sites.service'

export default function FavoritesPage() {
  useDocumentTitle('Mes favoris')

  const { favoriteIds, isFavorite, toggle, isLoading: loadingIds } = useFavorites('site')

  // Les identifiants valides de 'pending' (ajout en cours) sont ignorés par getSitesByIds
  const { data: sites, isLoading: loadingSites, error } = useAsync(
    () => getSitesByIds(favoriteIds),
    [favoriteIds.join(',')],
    { enabled: favoriteIds.length > 0 },
  )

  const loading = loadingIds || (loadingSites && !sites)

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-3xl font-bold text-sable-900 sm:text-4xl">Mes favoris</h1>
      <p className="mt-2 text-sable-600">Les sites que vous avez gardés de côté.</p>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <SiteCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="Impossible de charger vos favoris" description={error} />
        ) : favoriteIds.length === 0 || !sites || sites.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-6 w-6" aria-hidden="true" />}
            title="Aucun favori pour l’instant"
            description="Touchez le coeur d’un site pour le retrouver ici."
            action={
              <Link to={ROUTES.sites} className={buttonClasses({})}>
                Parcourir les sites
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard
                key={site.$id}
                site={site}
                isFavorite={isFavorite(site.$id)}
                onToggleFavorite={(siteId) => void toggle(siteId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}