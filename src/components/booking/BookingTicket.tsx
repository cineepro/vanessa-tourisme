// src/components/booking/BookingTicket.tsx — Vanessa Tourisme
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download, QrCode } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BOOKING_STATUS_META, PAYMENT_STATUS_LABELS } from '@/config/constants'
import { getErrorMessage } from '@/lib/appwrite'
import { cn } from '@/lib/cn'
import { formatPrice, formatVisitDate } from '@/lib/format'
import { toast } from '@/store/ui.store'
import type { Booking } from '@/types'

/** jsPDF (polices standard) ne gère pas les espaces insécables fines produites par Intl. */
const pdfSafe = (text: string): string => text.replace(/[\u202f\u00a0]/g, ' ')

function qrPayload(booking: Booking): string {
  return `${booking.reference}|${booking.qrToken ?? ''}`
}

export function BookingTicket({ booking, className }: { booking: Booking; className?: string }) {
  const [qr, setQr] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const status = BOOKING_STATUS_META[booking.status]

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(qrPayload(booking), {
      margin: 1,
      width: 240,
      color: { dark: '#084730', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQr(url)
      })
      .catch(() => {
        if (!cancelled) setQr(null)
      })
    return () => {
      cancelled = true
    }
  }, [booking.reference, booking.qrToken])

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })

      doc.setFillColor(0, 135, 81)
      doc.rect(0, 0, 210, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text('Vanessa Tourisme', 15, 18)

      doc.setTextColor(30, 30, 30)
      doc.setFontSize(12)
      doc.text('Billet de réservation', 15, 44)
      doc.setFontSize(26)
      doc.text(booking.reference, 15, 58)

      const rows: [string, string | null][] = [
        ['Site', booking.siteName],
        ['Prestation', booking.offerTitle],
        ['Guide', booking.guideName],
        ['Date', formatVisitDate(booking.visitDate, 'full')],
        ['Heure', booking.startTime],
        [
          'Participants',
          `${booking.adults} adulte(s)${booking.children > 0 ? `, ${booking.children} enfant(s)` : ''}`,
        ],
        ['Montant', formatPrice(booking.totalAmount, booking.currency)],
        ['Paiement', PAYMENT_STATUS_LABELS[booking.paymentStatus]],
        ['Statut', status.label],
        ['Contact', `${booking.contactName} · ${booking.contactPhone}`],
      ]

      let y = 76
      doc.setFontSize(11)
      rows.forEach(([label, value]) => {
        if (!value) return
        doc.setFont('helvetica', 'bold')
        doc.text(`${label} :`, 15, y)
        doc.setFont('helvetica', 'normal')
        doc.text(pdfSafe(value), 52, y, { maxWidth: 85 })
        y += 10
      })

      if (qr) doc.addImage(qr, 'PNG', 145, 40, 50, 50)

      doc.setFontSize(10)
      doc.setTextColor(90, 90, 90)
      doc.text('Présentez ce billet (ou son QR code) à votre guide le jour de la visite.', 15, 270)
      if (booking.status === 'pending') {
        doc.text('Réservation en attente de confirmation par l’agence.', 15, 277)
      }

      doc.save(`reservation-${booking.reference}.pdf`)
    } catch (error) {
      toast.error('Impossible de créer le PDF', getErrorMessage(error))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <article
      className={cn(
        'overflow-hidden rounded-3xl border border-sable-200 bg-white shadow-card',
        className,
      )}
    >
      <div className="flag-stripe h-1.5" />
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0 space-y-2">
          <Badge className={status.className}>{status.label}</Badge>
          <p className="text-xs font-semibold uppercase tracking-wider text-sable-500">Référence</p>
          <p className="font-display text-3xl font-bold tracking-tight text-sable-900">
            {booking.reference}
          </p>
          <p className="text-sm text-sable-700">
            {booking.siteName ?? 'Visite'} · {formatVisitDate(booking.visitDate, 'long')}
            {booking.startTime ? ` à ${booking.startTime}` : ''}
          </p>
          <p className="text-sm text-sable-500">
            {booking.adults} adulte{booking.adults > 1 ? 's' : ''}
            {booking.children > 0 ? `, ${booking.children} enfant${booking.children > 1 ? 's' : ''}` : ''}{' '}
            · {formatPrice(booking.totalAmount, booking.currency)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          {qr ? (
            <img src={qr} alt={`QR code de la réservation ${booking.reference}`} className="h-32 w-32" />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-sable-100 text-sable-400">
              <QrCode className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
          <p className="text-xs text-sable-500">À présenter à votre guide</p>
        </div>
      </div>

      <div className="border-t border-dashed border-sable-300 bg-sable-50 px-5 py-3 sm:px-6">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadPdf}
          isLoading={downloading}
          leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
        >
          Télécharger en PDF
        </Button>
      </div>
    </article>
  )
}