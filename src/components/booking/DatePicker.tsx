// src/components/booking/DatePicker.tsx — Vanessa Tourisme
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Spinner } from '@/components/ui/Spinner'
import { MONTH_LABELS_LONG } from '@/config/constants'
import { useAvailabilities } from '@/hooks/useOffers'
import { cn } from '@/lib/cn'
import { formatPrice, formatVisitDate, fromDateKey, toDateKey, dateKeyToIso } from '@/lib/format'
import { checkDateBookable, getOpenSlots } from '@/services/offers.service'
import type { Availability, Offer } from '@/types'

interface DatePickerProps {
  offer: Offer
  /** Date choisie, "YYYY-MM-DD" */
  value: string | null
  onChange: (dateKey: string) => void
  /** Créneau choisi (offres en mode "slots") */
  slot: Availability | null
  onSlotChange: (slot: Availability | null) => void
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MAX_MONTHS_AHEAD = 12

export function DatePicker({ offer, value, onChange, slot, onSlotChange }: DatePickerProps) {
  const today = new Date()
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [view, setView] = useState(() => {
    const base = value ? fromDateKey(value) : today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const isSlots = offer.bookingMode === 'slots'
  const from = toDateKey(view)
  const to = toDateKey(new Date(view.getFullYear(), view.getMonth() + 1, 0))
  const { data, isLoading } = useAvailabilities(offer.$id, from, to, isSlots)
  const slots = data ?? []

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const leadingBlanks = (view.getDay() + 6) % 7 // semaine commençant le lundi

  const monthsFromNow =
    (view.getFullYear() - currentMonth.getFullYear()) * 12 + view.getMonth() - currentMonth.getMonth()
  const canPrev = monthsFromNow > 0
  const canNext = monthsFromNow < MAX_MONTHS_AHEAD

  const shiftMonth = (step: number) =>
    setView((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))

  const openSlots = isSlots && value ? getOpenSlots(slots, value) : []

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-sable-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            disabled={!canPrev}
            aria-label="Mois précédent"
            className="rounded-full p-2 text-sable-700 hover:bg-sable-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <p className="flex items-center gap-2 font-display text-base font-bold capitalize text-sable-900">
            {MONTH_LABELS_LONG[view.getMonth()]} {view.getFullYear()}
            {isLoading && isSlots && <Spinner className="h-4 w-4" />}
          </p>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={!canNext}
            aria-label="Mois suivant"
            className="rounded-full p-2 text-sable-700 hover:bg-sable-100 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day, index) => (
            <span key={index} className="py-1 text-xs font-semibold text-sable-400" aria-hidden="true">
              {day}
            </span>
          ))}

          {Array.from({ length: leadingBlanks }, (_, index) => (
            <span key={`blank-${index}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1
            const key = toDateKey(new Date(view.getFullYear(), view.getMonth(), day))
            const check = checkDateBookable(offer, key, slots)
            const selected = key === value

            return (
              <button
                key={key}
                type="button"
                disabled={!check.bookable}
                title={check.bookable ? undefined : check.reason}
                aria-pressed={selected}
                aria-label={formatVisitDate(dateKeyToIso(key), 'full')}
                onClick={() => onChange(key)}
                className={cn(
                  'aspect-square rounded-xl text-sm font-medium transition-colors',
                  selected
                    ? 'bg-primary-600 text-white'
                    : check.bookable
                      ? 'text-sable-900 hover:bg-primary-50'
                      : 'cursor-not-allowed text-sable-300 line-through',
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {isSlots && value && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-sable-800">Choisissez un horaire</legend>
          {openSlots.length === 0 ? (
            <p className="rounded-2xl bg-sable-100 px-4 py-3 text-sm text-sable-600">
              Aucun créneau disponible ce jour-là.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {openSlots.map((item) => {
                const active = slot?.$id === item.$id
                const left = item.capacity - item.booked
                return (
                  <button
                    key={item.$id}
                    type="button"
                    onClick={() => onSlotChange(item)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-2xl border px-3 py-2.5 text-left transition-colors',
                      active
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-sable-300 bg-white hover:bg-sable-100',
                    )}
                  >
                    <span className="block font-display text-base font-bold text-sable-900">
                      {item.startTime}
                    </span>
                    <span className="block text-xs text-sable-500">
                      {left} place{left > 1 ? 's' : ''}
                      {item.priceOverride != null
                        ? ` · ${formatPrice(item.priceOverride, offer.currency)}`
                        : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </fieldset>
      )}
    </div>
  )
}