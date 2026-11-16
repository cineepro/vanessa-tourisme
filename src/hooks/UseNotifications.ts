// src/hooks/useNotifications.ts — Vanessa Tourisme
import { useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useAuthStore } from '@/store/auth.store'
import { acquireNotifications, useNotificationsStore } from '@/store/notifications.store'

/**
 * Notifications du touriste avec temps réel.
 * Peut être utilisé dans plusieurs composants (barre de navigation, page des
 * notifications) : l'état est partagé et il n'y a qu'un seul abonnement.
 */
export function useNotifications() {
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId) {
      useNotificationsStore.getState().reset()
      return
    }
    return acquireNotifications(userId)
  }, [userId])

  const state = useNotificationsStore(
    useShallow((s) => ({
      notifications: s.notifications,
      unreadCount: s.unreadCount,
      isLoading: s.isLoading,
      markAsRead: s.markAsRead,
    })),
  )
  const markAll = useNotificationsStore((s) => s.markAllAsRead)

  const markAllAsRead = useCallback(async () => {
    if (userId) await markAll(userId)
  }, [markAll, userId])

  return { ...state, markAllAsRead }
}