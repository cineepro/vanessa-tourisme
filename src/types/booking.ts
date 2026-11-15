import type { BaseDoc, Currency } from './index'
import type { PaymentMode } from './offer'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled_by_user'
  | 'cancelled_by_agency'
  | 'completed'
  | 'no_show'

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'paid'
  | 'refunded'
  | 'partially_refunded'

export type BookingSource = 'site' | 'vanessa_chat' | 'agency_manual'

/** Collection `tour_bookings` (ecriture reservee aux Functions) */
export interface Booking extends BaseDoc {
  /** Ex: VT-2611-A7K2 */
  reference: string
  userId: string
  agencyId: string
  offerId: string
  siteId: string
  guideId: string | null
  availabilityId: string | null

  /** Copies figees au moment de la reservation */
  siteName: string | null
  guideName: string | null
  offerTitle: string | null

  visitDate: string
  startTime: string | null
  adults: number
  children: number

  unitPrice: number
  childUnitPrice: number | null
  totalAmount: number
  currency: Currency

  status: BookingStatus
  paymentStatus: PaymentStatus
  paymentMode: PaymentMode | null

  contactName: string
  contactPhone: string
  contactEmail: string | null
  nationality: string | null
  pickupLocation: string | null
  specialRequests: string | null

  source: BookingSource
  qrToken: string | null
  confirmedAt: string | null
  cancelledAt: string | null
  completedAt: string | null
  cancelReason: string | null
  reviewed: boolean
}

/** Envoye a la Function `tour-create-booking` */
export interface CreateBookingInput {
  offerId: string
  availabilityId?: string
  /** "YYYY-MM-DD" */
  visitDate: string
  /** "HH:mm" */
  startTime?: string
  adults: number
  children?: number
  contactName: string
  contactPhone: string
  contactEmail?: string
  nationality?: string
  pickupLocation?: string
  specialRequests?: string
  source?: BookingSource
}

export type BookingAction =
  | 'confirm'
  | 'reject'
  | 'cancel'
  | 'complete'
  | 'no_show'

/** Envoye a la Function `tour-booking-status` */
export interface UpdateBookingStatusInput {
  bookingId: string
  action: BookingAction
  reason?: string
}

export type PaymentProvider = 'fedapay' | 'kkiapay' | 'cinetpay' | 'cash' | 'manual'
export type PaymentMethod = 'mtn_momo' | 'moov_money' | 'celtiis_cash' | 'card' | 'cash'
export type PaymentTxStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'

/** Collection `tour_payments` (phase 2) */
export interface Payment extends BaseDoc {
  bookingId: string
  userId: string
  agencyId: string
  provider: PaymentProvider
  method: PaymentMethod | null
  amount: number
  currency: Currency
  status: PaymentTxStatus
  providerTransactionId: string | null
  paidAt: string | null
  refundedAt: string | null
}