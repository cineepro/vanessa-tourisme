import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { getErrorMessage } from '@/lib/appwrite'
import * as bookingService from '@/services/bookings.service'
import type { Booking, Offer, SessionUser, TouristProfile } from '@/types'

/* ------------------------------------------------------------
   Brouillon de reservation
   Conserve dans sessionStorage : si le visiteur doit se connecter
   en cours de route, il retrouve sa saisie au retour.
------------------------------------------------------------ */
export interface BookingDraft {
  offerId: string | null
  /** "YYYY-MM-DD" */
  visitDate: string | null
  /** "HH:mm" */
  startTime: string | null
  availabilityId: string | null
  adults: number
  children: number
  contactName: string
  contactPhone: string
  contactEmail: string
  nationality: string
  pickupLocation: string
  specialRequests: string
}

export type BookingStep = 'choose' | 'contact' | 'review' | 'done'

const emptyDraft: BookingDraft = {
  offerId: null,
  visitDate: null,
  startTime: null,
  availabilityId: null,
  adults: 1,
  children: 0,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  nationality: '',
  pickupLocation: '',
  specialRequests: '',
}

interface BookingState {
  draft: BookingDraft
  step: BookingStep
  isSubmitting: boolean
  lastBooking: Booking | null
  error: string | null

  bookings: Booking[]
  isLoadingBookings: boolean

  setDraft: (patch: Partial<BookingDraft>) => void
  setStep: (step: BookingStep) => void
  /** Demarre une reservation pour une offre (reinitialise si l'offre change). */
  startFor: (offerId: string) => void
  /** Pre-remplit les coordonnees depuis le compte et le profil. */
  prefill: (user: SessionUser, profile: TouristProfile | null) => void
  submit: (offer: Offer) => Promise<Booking | null>

  loadBookings: (userId: string) => Promise<void>
  cancelBooking: (bookingId: string, reason?: string) => Promise<boolean>

  clearError: () => void
  resetDraft: () => void
  reset: () => void
}

const blankToUndefined = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      draft: emptyDraft,
      step: 'choose',
      isSubmitting: false,
      lastBooking: null,
      error: null,
      bookings: [],
      isLoadingBookings: false,

      setDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

      setStep: (step) => set({ step }),

      startFor: (offerId) => {
        if (get().draft.offerId === offerId) return
        set({ draft: { ...emptyDraft, offerId }, step: 'choose', error: null, lastBooking: null })
      },

      prefill: (user, profile) =>
        set((state) => ({
          draft: {
            ...state.draft,
            contactName: state.draft.contactName || user.name,
            contactEmail: state.draft.contactEmail || user.email,
            contactPhone: state.draft.contactPhone || profile?.phone || '',
            nationality: state.draft.nationality || profile?.nationality || '',
          },
        })),

      submit: async (offer) => {
        const { draft, isSubmitting } = get()
        if (isSubmitting) return null

        if (!draft.offerId || !draft.visitDate) {
          set({ error: 'Choisissez une date de visite.' })
          return null
        }

        set({ isSubmitting: true, error: null })
        try {
          const booking = await bookingService.createBooking({
            offerId: offer.$id,
            availabilityId: draft.availabilityId ?? undefined,
            visitDate: draft.visitDate,
            startTime: draft.startTime ?? undefined,
            adults: draft.adults,
            children: draft.children,
            contactName: draft.contactName.trim(),
            contactPhone: draft.contactPhone.trim(),
            contactEmail: blankToUndefined(draft.contactEmail),
            nationality: blankToUndefined(draft.nationality),
            pickupLocation: blankToUndefined(draft.pickupLocation),
            specialRequests: blankToUndefined(draft.specialRequests),
            source: 'site',
          })

          set((state) => ({
            isSubmitting: false,
            lastBooking: booking,
            step: 'done',
            draft: emptyDraft,
            bookings: [booking, ...state.bookings.filter((b) => b.$id !== booking.$id)],
          }))
          return booking
        } catch (error) {
          set({ isSubmitting: false, error: getErrorMessage(error) })
          return null
        }
      },

      loadBookings: async (userId) => {
        set({ isLoadingBookings: true, error: null })
        try {
          const { documents } = await bookingService.listMyBookings(userId)
          set({ bookings: documents, isLoadingBookings: false })
        } catch (error) {
          set({ isLoadingBookings: false, error: getErrorMessage(error) })
        }
      },

      cancelBooking: async (bookingId, reason) => {
        set({ error: null })
        try {
          const updated = await bookingService.cancelBooking(bookingId, reason)
          set((state) => ({
            bookings: state.bookings.map((b) => (b.$id === bookingId ? updated : b)),
          }))
          return true
        } catch (error) {
          set({ error: getErrorMessage(error) })
          return false
        }
      },

      clearError: () => set({ error: null }),

      resetDraft: () => set({ draft: emptyDraft, step: 'choose', error: null }),

      reset: () =>
        set({
          draft: emptyDraft,
          step: 'choose',
          isSubmitting: false,
          lastBooking: null,
          error: null,
          bookings: [],
          isLoadingBookings: false,
        }),
    }),
    {
      name: 'vt-booking-draft',
      storage: createJSONStorage(() => sessionStorage),
      // Seul le brouillon est conserve (pas la liste des reservations)
      partialize: (state) => ({
        draft: state.draft,
        step: state.step === 'done' ? 'choose' : state.step,
      }),
    },
  ),
)