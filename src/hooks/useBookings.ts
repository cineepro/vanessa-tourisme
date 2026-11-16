import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { splitBookings } from '@/services/bookings.service'
import { useAuthStore } from '@/store/auth.store'
import { useBookingStore } from '@/store/booking.store'

/** Reservations du touriste connecte, separees en "a venir" et "historique". */
export function useBookings(options: { autoLoad?: boolean } = {}) {
  const { autoLoad = true } = options
  const userId = useAuthStore((s) => s.user?.id)

  const { bookings, isLoadingBookings, error, loadBookings, cancelBooking } = useBookingStore(
    useShallow((s) => ({
      bookings: s.bookings,
      isLoadingBookings: s.isLoadingBookings,
      error: s.error,
      loadBookings: s.loadBookings,
      cancelBooking: s.cancelBooking,
    })),
  )

  useEffect(() => {
    if (autoLoad && userId) void loadBookings(userId)
  }, [autoLoad, userId, loadBookings])

  const { upcoming, past } = useMemo(() => splitBookings(bookings), [bookings])

  return {
    bookings,
    upcoming,
    past,
    isLoading: isLoadingBookings,
    error,
    reload: () => (userId ? loadBookings(userId) : Promise.resolve()),
    cancelBooking,
  }
}