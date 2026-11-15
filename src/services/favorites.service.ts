import { COLLECTIONS } from '@/config/appwrite-ids'
import {
  AppwriteException,
  createDocument,
  deleteDocument,
  listDocuments,
  Permission,
  Query,
  Role,
} from '@/lib/appwrite'
import type { Favorite, FavoriteTarget } from '@/types'

export async function listFavorites(
  userId: string,
  targetType?: FavoriteTarget,
): Promise<Favorite[]> {
  const queries: string[] = [Query.equal('userId', userId)]
  if (targetType) queries.push(Query.equal('targetType', targetType))
  queries.push(Query.orderDesc('$createdAt'))
  queries.push(Query.limit(200))

  const { documents } = await listDocuments<Favorite>(COLLECTIONS.favorites, queries)
  return documents
}

/** { idDeLaCible: idDuFavori } pour savoir vite si un element est en favori. */
export async function getFavoriteMap(
  userId: string,
  targetType: FavoriteTarget,
): Promise<Record<string, string>> {
  const favorites = await listFavorites(userId, targetType)
  return Object.fromEntries(favorites.map((fav) => [fav.targetId, fav.$id]))
}

export async function addFavorite(
  userId: string,
  targetType: FavoriteTarget,
  targetId: string,
): Promise<Favorite> {
  try {
    return await createDocument<Favorite>(
      COLLECTIONS.favorites,
      { userId, targetType, targetId },
      {
        permissions: [Permission.read(Role.user(userId)), Permission.delete(Role.user(userId))],
      },
    )
  } catch (error) {
    // Index unique : deja en favori, on retrouve l'existant
    if (error instanceof AppwriteException && error.code === 409) {
      const { documents } = await listDocuments<Favorite>(COLLECTIONS.favorites, [
        Query.equal('userId', userId),
        Query.equal('targetType', targetType),
        Query.equal('targetId', targetId),
        Query.limit(1),
      ])
      if (documents[0]) return documents[0]
    }
    throw error
  }
}

export function removeFavorite(favoriteId: string): Promise<void> {
  return deleteDocument(COLLECTIONS.favorites, favoriteId)
}