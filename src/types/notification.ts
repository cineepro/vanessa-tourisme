import type { BaseDoc } from './index'

export type NotificationType =
  | 'booking_pending'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'payment'
  | 'review_request'
  | 'system'

/** Collection `tour_notifications` */
export interface AppNotification extends BaseDoc {
  userId: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  bookingId: string | null
  isRead: boolean
  readAt: string | null
}