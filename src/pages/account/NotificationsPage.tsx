// src/pages/account/NotificationsPage.tsx — Vanessa Tourisme
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarCheck,
  CalendarX,
  CheckCheck,
  CreditCard,
  Info,
  Star,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/format'
import type { AppNotification, NotificationType } from '@/types'

const ICONS: Record<NotificationType, LucideIcon> = {
  booking_pending: CalendarCheck,
  booking_confirmed: CalendarCheck,
  booking_rejected: CalendarX,
  booking_cancelled: CalendarX,
  booking_reminder: Bell,
  payment: CreditCard,
  review_request: Star,
  system: Info,
}

export default function NotificationsPage() {
  useDocumentTitle('Notifications')

  const navigate = useNavigate()
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications()

  const open = (notification: AppNotification) => {
    void markAsRead(notification.$id)
    // Seuls les liens internes sont suivis
    if (notification.link && notification.link.startsWith('/') && !notification.link.startsWith('//')) {
      navigate(notification.link)
    }
  }

  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-sable-900 sm:text-4xl">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void markAllAsRead()}
            leftIcon={<CheckCheck className="h-4 w-4" aria-hidden="true" />}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="mt-6">
        {isLoading && notifications.length === 0 ? (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" aria-hidden="true" />}
            title="Aucune notification"
            description="Les confirmations, rappels et réponses de l’agence apparaîtront ici."
          />
        ) : (
          <ul className="space-y-2">
            {notifications.map((notification) => {
              const Icon = ICONS[notification.type]
              return (
                <li key={notification.$id}>
                  <button
                    type="button"
                    onClick={() => open(notification)}
                    className={cn(
                      'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors',
                      notification.isRead
                        ? 'border-sable-200 bg-white hover:bg-sable-50'
                        : 'border-primary-200 bg-primary-50 hover:bg-primary-100',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        notification.isRead ? 'bg-sable-100 text-sable-500' : 'bg-primary-600 text-white',
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-sable-900">{notification.title}</span>
                        <time className="shrink-0 text-xs text-sable-500" dateTime={notification.$createdAt}>
                          {formatRelative(notification.$createdAt)}
                        </time>
                      </span>
                      {notification.body && (
                        <span className="mt-0.5 block text-sm text-sable-600">{notification.body}</span>
                      )}
                    </span>
                    {!notification.isRead && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-danger-600" aria-label="Non lue" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}