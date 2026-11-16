import { useCallback, useEffect, useState } from 'react'

import { getErrorMessage } from '@/lib/appwrite'
import { addFavorite, getFavoriteMap, removeFavorite } from '@/services/favorites.service'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/ui.store'
import type { FavoriteTarget } from '@/types'
import { useRequireAuth } from './useRequireAuth'

/**
 * Favoris d'un type donne (sites, guides, offres) avec mise a jour immediate.
 * toggle() ouvre la fenetre de connexion si le visiteur n'est pas connecte.
 */
export function useFavorites(targetType: FavoriteTarget = 'site') {
  const userId = useAuthStore((s) => s.user?.id)
  const requireAuth = useRequireAuth()

  // { idDeLaCible: idDuFavori }
  const [map, setMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setMap({})
      return
    }

    let cancelled = false
    setIsLoading(true)
    getFavoriteMap(userId, targetType)
      .then((result) => {
        if (!cancelled) setMap(result)
      })
      .catch((error: unknown) => console.warn('[favoris]', getErrorMessage(error)))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, targetType])

  const isFavorite = useCallback((targetId: string) => targetId in map, [map])

  const toggle = useCallback(
    async (targetId: string): Promise<void> => {
      if (!requireAuth() || !userId) return

      const existing = map[targetId]

      if (existing) {
        // Retrait immediat, retour en arriere si le serveur refuse
        setMap((current) => {
          const { [targetId]: _removed, ...rest } = current
          return rest
        })
        try {
          await removeFavorite(existing)
        } catch (error) {
          setMap((current) => ({ ...current, [targetId]: existing }))
          toast.error('Impossible de retirer ce favori', getErrorMessage(error))
        }
        return
      }

      setMap((current) => ({ ...current, [targetId]: 'pending' }))
      try {
        const favorite = await addFavorite(userId, targetType, targetId)
        setMap((current) => ({ ...current, [targetId]: favorite.$id }))
      } catch (error) {
        setMap((current) => {
          const { [targetId]: _removed, ...rest } = current
          return rest
        })
        toast.error('Impossible d’ajouter ce favori', getErrorMessage(error))
      }
    },
    [map, requireAuth, targetType, userId],
  )

  return { favoriteIds: Object.keys(map), isFavorite, toggle, isLoading }
}