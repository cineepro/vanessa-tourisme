import { MONTH_LABELS_SHORT } from '@/config/constants'
import type { Currency } from '@/types'

const LOCALE = 'fr-FR'

type DateInput = string | Date | null | undefined

function toDate(input: DateInput): Date | null {
  if (!input) return null
  const date = input instanceof Date ? input : new Date(input)
  return Number.isNaN(date.getTime()) ? null : date
}

/* ------------------------------------------------------------
   Prix
------------------------------------------------------------ */
/** 15000 -> "15 000 F CFA". Le XOF n'a pas de centimes. */
export function formatPrice(
  amount: number | null | undefined,
  currency: Currency = 'XOF',
  options: { free?: boolean } = {},
): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  if (options.free && amount === 0) return 'Gratuit'

  const digits = currency === 'XOF' ? 0 : 2
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}

/* ------------------------------------------------------------
   Dates
------------------------------------------------------------ */
export function formatDate(
  input: DateInput,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium',
): string {
  const date = toDate(input)
  if (!date) return '—'
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: style }).format(date)
}

export function formatDateTime(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatTime(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '—'
  return new Intl.DateTimeFormat(LOCALE, { timeStyle: 'short' }).format(date)
}

/** "il y a 3 heures", "dans 2 jours" */
export function formatRelative(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '—'

  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSeconds)

  if (abs < 60) return rtf.format(diffSeconds, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour')
  if (abs < 2592000) return rtf.format(Math.round(diffSeconds / 86400), 'day')
  if (abs < 31536000) return rtf.format(Math.round(diffSeconds / 2592000), 'month')
  return rtf.format(Math.round(diffSeconds / 31536000), 'year')
}

/**
 * Cles de date "YYYY-MM-DD" : utilisees pour les disponibilites et les visites.
 * La date de visite est stockee a minuit UTC pour ne jamais glisser d'un jour
 * selon le fuseau du touriste.
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function dateKeyToIso(key: string): string {
  return `${key}T00:00:00.000Z`
}

export function isoToDateKey(iso: string): string {
  return iso.slice(0, 10)
}

/** Affiche une date de visite (stockee en UTC) sans decalage de fuseau. */
export function formatVisitDate(
  input: DateInput,
  style: 'short' | 'medium' | 'long' | 'full' = 'long',
): string {
  const date = toDate(input)
  if (!date) return '—'
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: style, timeZone: 'UTC' }).format(date)
}

/* ------------------------------------------------------------
   Durees, distances, notes
------------------------------------------------------------ */
/** 45 -> "45 min", 150 -> "2 h 30", 1440 -> "1 jour" */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return '—'
  if (minutes < 60) return `${Math.round(minutes)} min`

  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440)
    return `${days} jour${days > 1 ? 's' : ''}`
  }

  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

/** 0.35 -> "350 m", 2.43 -> "2,4 km", 12.7 -> "13 km" */
export function formatDistance(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return '—'
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`

  if (km < 10) {
    return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(km)} km`
  }
  return `${Math.round(km)} km`
}

/** 4.5 -> "4,5" */
export function formatRating(average: number | null | undefined): string {
  if (!average) return '—'
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(average)
}

/** [11,12,1,2,3] -> "nov. – mars" ; [1,2,6] -> "janv. – févr., juin" */
export function formatMonths(months: number[] | null | undefined): string {
  if (!months || months.length === 0) return '—'

  const sorted = [...new Set(months)].filter((m) => m >= 1 && m <= 12).sort((a, b) => a - b)
  if (sorted.length === 0) return '—'
  if (sorted.length === 12) return 'Toute l’année'

  const ranges: [number, number][] = []
  for (const month of sorted) {
    const last = ranges[ranges.length - 1]
    if (last && month === last[1] + 1) last[1] = month
    else ranges.push([month, month])
  }

  // Fusionne decembre -> janvier (ex: nov. - mars)
  if (ranges.length > 1) {
    const first = ranges[0]
    const last = ranges[ranges.length - 1]
    if (first[0] === 1 && last[1] === 12) {
      ranges.shift()
      last[1] = first[1]
      ranges[ranges.length - 1] = [last[0], first[1]]
    }
  }

  return ranges
    .map(([from, to]) =>
      from === to
        ? MONTH_LABELS_SHORT[from - 1]
        : `${MONTH_LABELS_SHORT[from - 1]} – ${MONTH_LABELS_SHORT[to - 1]}`,
    )
    .join(', ')
}

/* ------------------------------------------------------------
   Texte
------------------------------------------------------------ */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

/** "Kofi Mensah" -> "KM" */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + second).toUpperCase()
}

/** "Kofi Mensah" -> "Kofi M." (affichage public des avis) */
export function shortName(name: string | null | undefined): string {
  if (!name) return 'Voyageur'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Voyageur'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

/** pluralize(3, 'visiteur') -> "3 visiteurs" */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count > 1 ? (plural ?? `${singular}s`) : singular}`
}

/* ------------------------------------------------------------
   Contact
------------------------------------------------------------ */
export function whatsappUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}