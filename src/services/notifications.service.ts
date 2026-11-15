import { COLLECTIONS } from '@/config/appwrite-ids'
import { DATABASE_ID, client, deleteDocument, listDocuments, Query, updateDocument } from '@/lib/appwrite'
import type { AppNotification } from '@/types'

export async function listNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {},
): Promise<AppNotification[]> {
  const queries: string[] = [Query.equal('userId', userId)]
  if (options.unreadOnly) queries.push(Query.equal('isRead', false))
  queries.push(Query.orderDesc('$createdAt'))
  queries.push(Query.limit(options.limit ?? 30))

  const { documents } = await listDocuments<AppNotification>(COLLECTIONS.notifications, queries)
  return documents
}

export async function countUnread(userId: string): Promise<number> {
  const { total } = await listDocuments<AppNotification>(COLLECTIONS.notifications, [
    Query.equal('userId', userId),
    Query.equal('isRead', false),
    Query.limit(1),
  ])
  return total
}

export function markAsRead(id: string): Promise<AppNotification> {
  return updateDocument<AppNotification>(COLLECTIONS.notifications, id, {
    isRead: true,
    readAt: new Date().toISOString(),
  })
}

export async function markAllAsRead(userId: string): Promise<void> {
  const unread = await listNotifications(userId, { unreadOnly: true, limit: 100 })
  const readAt = new Date().toISOString()
  await Promise.all(
    unread.map((n) =>
      updateDocument<AppNotification>(COLLECTIONS.notifications, n.$id, { isRead: true, readAt }),
    ),
  )
}

export function deleteNotification(id: string): Promise<void> {
  return deleteDocument(COLLECTIONS.notifications, id)
}

/**
 * Nouvelles notifications en temps reel. Appwrite n'envoie que les documents
 * que l'utilisateur a le droit de lire. Renvoie la fonction de desabonnement.
 */
export function subscribeToNotifications(
  userId: string,
  onCreate: (notification: AppNotification) => void,
): () => void {
  const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.notifications}.documents`

  // Selon la version du SDK, subscribe renvoie une fonction ou une promesse de fonction
  const subscription: unknown = client.subscribe(
    channel,
    (event: { events: string[]; payload: unknown }) => {
      if (!event.events.some((name) => name.endsWith('.create'))) return
      const notification = event.payload as AppNotification
      if (notification.userId === userId) onCreate(notification)
    },
  )

  return () => {
    void Promise.resolve(subscription).then((unsubscribe) => {
      if (typeof unsubscribe === 'function') unsubscribe()
    })
  }
}