import { useCallback, useEffect, useState } from 'react'

import { getErrorMessage } from '@/lib/appwrite'
import {
  countUnread,
  listNotifications,
  markAllAsRead as markAllAsReadService,
  markAsRead as markAsReadService,
  subscribeToNotifications,
} from '@/services/notifications.service'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/ui.store'
import type { AppNotification } from '@/types'

/**
 * Notifications du touriste, avec temps reel.
 * A utiliser une seule fois (par exemple dans la barre de navigation) pour
 * ne pas ouvrir plusieurs abonnements ; la page des notifications peut
 * recevoir les donnees en props.
 */
export function useNotifications(options: { limit?: number } = {}) {
  const { limit = 30 } = options
  const userId = useAuthStore((s) => s.user?.id)

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    let cancelled = false
    setIsLoading(true)

    Promise.all([listNotifications(userId, { limit }), countUnread(userId)])
      .then(([list, unread]) => {
        if (cancelled) return
        setNotifications(list)
        setUnreadCount(unread)
      })
      .catch((error: unknown) => console.warn('[notifications]', getErrorMessage(error)))
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    const unsubscribe = subscribeToNotifications(userId, (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, limit))
      setUnreadCount((count) => count + 1)
      toast.info(notification.title, notification.body ?? undefined)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [userId, limit])

  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.$id === id)
      if (!target || target.isRead) return

      setNotifications((current) => current.map((n) => (n.$id === id ? { ...n, isRead: true } : n)))
      setUnreadCount((count) => Math.max(0, count - 1))
      try {
        await markAsReadService(id)
      } catch (error) {
        setNotifications((current) => current.map((n) => (n.$id === id ? { ...n, isRead: false } : n)))
        setUnreadCount((count) => count + 1)
        toast.error('Action impossible', getErrorMessage(error))
      }
    },
    [notifications],
  )

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return
    const snapshot = notifications
    const previousCount = unreadCount

    setNotifications((current) => current.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await markAllAsReadService(userId)
    } catch (error) {
      setNotifications(snapshot)
      setUnreadCount(previousCount)
      toast.error('Action impossible', getErrorMessage(error))
    }
  }, [notifications, unreadCount, userId])

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead }
}