import type { BaseDoc } from './index'

export type FavoriteTarget = 'site' | 'guide' | 'offer'

/** Collection `tour_favorites` */
export interface Favorite extends BaseDoc {
  userId: string
  targetType: FavoriteTarget
  targetId: string
}