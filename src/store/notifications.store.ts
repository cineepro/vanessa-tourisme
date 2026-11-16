// src/store/notifications.store.ts — Vanessa Tourisme
import { create } from 'zustand'

import { getErrorMessage } from '@/lib/appwrite'
import {
  countUnread,
  listNotifications,
  markAllAsRead as markAllAsReadService,
  markAsRead as markAsReadService,
  subscribeToNotifications,
} from '@/services/notifications.service'
import type { AppNotification } from '@/types'
import { toast } from './ui.store'

const PAGE = 50

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean

  load: (userId: string) => Promise<void>
  add: (notification: AppNotification) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: (userId: string) => Promise<void>
  reset: () => void
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  load: async (userId) => {
    set({ isLoading: true })
    try {
      const [notifications, unreadCount] = await Promise.all([
        listNotifications(userId, { limit: PAGE }),
        countUnread(userId),
      ])
      set({ notifications, unreadCount, isLoading: false })
    } catch (error) {
      console.warn('[notifications]', getErrorMessage(error))
      set({ isLoading: false })
    }
  },

  add: (notification) => {
    if (get().notifications.some((item) => item.$id === notification.$id)) return
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, PAGE),
      unreadCount: state.unreadCount + 1,
    }))
    toast.info(notification.title, notification.body ?? undefined)
  },

  markAsRead: async (id) => {
    const target = get().notifications.find((item) => item.$id === id)
    if (!target || target.isRead) return

    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.$id === id ? { ...item, isRead: true } : item,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))

    try {
      await markAsReadService(id)
    } catch (error) {
      set((state) => ({
        notifications: state.notifications.map((item) =>
          item.$id === id ? { ...item, isRead: false } : item,
        ),
        unreadCount: state.unreadCount + 1,
      }))
      toast.error('Action impossible', getErrorMessage(error))
    }
  },

  markAllAsRead: async (userId) => {
    const { notifications, unreadCount } = get()
    if (unreadCount === 0) return

    set({
      notifications: notifications.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    })

    try {
      await markAllAsReadService(userId)
    } catch (error) {
      set({ notifications, unreadCount })
      toast.error('Action impossible', getErrorMessage(error))
    }
  },

  reset: () => set({ notifications: [], unreadCount: 0, isLoading: false }),
}))

/* ------------------------------------------------------------
   Abonnement temps réel partagé : une seule connexion, quel que soit
   le nombre de composants qui utilisent useNotifications().
------------------------------------------------------------ */
let consumers = 0
let activeUserId: string | null = null
let stopRealtime: (() => void) | null = null

function stop(): void {
  stopRealtime?.()
  stopRealtime = null
  activeUserId = null
}

/** Démarre (si besoin) le chargement et le temps réel ; renvoie la fonction d'arrêt. */
export function acquireNotifications(userId: string): () => void {
  consumers += 1

  if (activeUserId !== userId) {
    stop()
    activeUserId = userId
    void useNotificationsStore.getState().load(userId)
    stopRealtime = subscribeToNotifications(userId, (notification) =>
      useNotificationsStore.getState().add(notification),
    )
  }

  return () => {
    consumers = Math.max(0, consumers - 1)
    if (consumers === 0) stop()
  }
}