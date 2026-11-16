// src/components/booking/CancelBookingModal.tsx — Vanessa Tourisme
import { useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Textarea } from '@/components/ui/Textarea'
import { getErrorMessage } from '@/lib/appwrite'
import { toast } from '@/store/ui.store'
import type { Booking } from '@/types'

interface CancelBookingModalProps {
  booking: Booking | null
  /** Effectue l'annulation ; renvoie true en cas de succès */
  onCancel: (bookingId: string, reason?: string) => Promise<boolean>
  onClose: () => void
}

export function CancelBookingModal({ booking, onCancel, onClose }: CancelBookingModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (booking) setReason('')
  }, [booking])

  const confirm = async () => {
    if (!booking) return
    setLoading(true)
    try {
      const ok = await onCancel(booking.$id, reason.trim() || undefined)
      if (ok) {
        toast.success('Réservation annulée')
        onClose()
      } else {
        toast.error('Annulation impossible', 'Veuillez réessayer ou contacter l’agence.')
      }
    } catch (error) {
      toast.error('Annulation impossible', getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfirmDialog
      open={booking !== null}
      title="Annuler cette réservation ?"
      description={
        booking
          ? `${booking.siteName ?? 'Votre visite'} · ${booking.reference}. Les conditions d’annulation de la prestation s’appliquent.`
          : undefined
      }
      confirmLabel="Oui, annuler"
      cancelLabel="Garder ma réservation"
      danger
      isLoading={loading}
      onConfirm={() => void confirm()}
      onClose={onClose}
    >
      <Textarea
        label="Motif (optionnel)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={500}
        showCounter
        rows={3}
      />
    </ConfirmDialog>
  )
}