// functions/tour-payment-webhook/src/main.js — Vanessa Tourisme
//
// ╔═══════════════════════ PHASE 2 : PAIEMENT EN LIGNE ═══════════════════════╗
// ║ Cette function est un SOCLE SÛR (signature vérifiée, idempotence, contrôle ║
// ║ du montant, mise à jour de la réservation). Le format exact des messages  ║
// ║ dépend du fournisseur choisi (FedaPay, Kkiapay, CinetPay…) : la fonction   ║
// ║ `normalize` ci-dessous est à confirmer avec SA documentation avant mise   ║
// ║ en production. Tant que le paiement en ligne n'est pas branché sur le      ║
// ║ site, laissez toutes vos offres en « Paiement sur place ».                 ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
//
// Appel : requête HTTP POST du fournisseur (exécution publique : "Any").
// Variables : PAYMENT_WEBHOOK_SECRET (obligatoire), PAYMENT_PROVIDER (défaut : fedapay),
//             PAYMENT_SIGNATURE_HEADER (défaut : x-signature)
import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  COL,
  HttpError,
  P,
  R,
  assertConfig,
  createApi,
  handleError,
  isConflict,
  isId,
  isNotFound,
  stableId,
} from './utils.js'

const PROVIDERS = ['fedapay', 'kkiapay', 'cinetpay']
const STATUSES = ['succeeded', 'failed', 'cancelled', 'refunded']

/** Compare la signature HMAC-SHA256 (hex) du corps brut avec celle de l'en-tête. */
export function verifySignature(rawBody, headerValue, secret) {
  if (!secret || !headerValue) return false
  const received = String(headerValue).replace(/^sha256=/i, '').trim().toLowerCase()
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Convertit le message du fournisseur en format interne :
 *   { transactionId, bookingId, status, amount, currency, method }
 * ⚠ À CONFIRMER avec la documentation du fournisseur.
 */
export function normalize(provider, payload) {
  if (provider === 'fedapay') {
    const e = payload.entity ?? payload
    const statusMap = { approved: 'succeeded', transferred: 'succeeded', declined: 'failed', canceled: 'cancelled', cancelled: 'cancelled', refunded: 'refunded' }
    const modeMap = { mtn: 'mtn_momo', mtn_open: 'mtn_momo', moov: 'moov_money', celtiis: 'celtiis_cash', card: 'card' }
    return {
      transactionId: String(e.id ?? ''),
      bookingId: e.custom_metadata?.booking_id ?? e.custom_metadata?.bookingId ?? null,
      status: statusMap[e.status] ?? null,
      amount: Number(e.amount),
      currency: String(e.currency?.iso ?? e.currency ?? 'XOF').toUpperCase(),
      method: modeMap[e.mode] ?? null,
    }
  }
  // Format interne direct (autres fournisseurs, après adaptation de votre côté)
  return {
    transactionId: String(payload.transactionId ?? ''),
    bookingId: payload.bookingId ?? null,
    status: payload.status ?? null,
    amount: Number(payload.amount),
    currency: String(payload.currency ?? 'XOF').toUpperCase(),
    method: payload.method ?? null,
  }
}

export default async ({ req, res, log, error }) => {
  try {
    if (req.method !== 'POST') return res.json({ ok: false, error: 'method_not_allowed' }, 405)
    assertConfig()

    const provider = process.env.PAYMENT_PROVIDER || 'fedapay'
    if (!PROVIDERS.includes(provider)) throw new HttpError(500, 'CONFIG', 'PAYMENT_PROVIDER inconnu.')

    // Le corps BRUT sert à la signature : on ne le reformate jamais avant de la vérifier
    const raw = typeof req.bodyText === 'string' ? req.bodyText : JSON.stringify(req.bodyJson ?? {})
    const header = req.headers[(process.env.PAYMENT_SIGNATURE_HEADER || 'x-signature').toLowerCase()]
    if (!verifySignature(raw, header, process.env.PAYMENT_WEBHOOK_SECRET)) {
      return res.json({ ok: false, error: 'invalid_signature' }, 401)
    }

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return res.json({ ok: false, error: 'bad_json' }, 400)
    }

    const event = normalize(provider, payload)
    if (!event.transactionId || !isId(event.bookingId) || !STATUSES.includes(event.status) || !Number.isFinite(event.amount)) {
      log('Message ignoré : format non reconnu.')
      return res.json({ ok: true, data: { ignored: true } })
    }

    const api = createApi(req)

    let booking
    try {
      booking = await api.getDoc(COL.bookings, event.bookingId)
    } catch (e) {
      if (isNotFound(e)) return res.json({ ok: true, data: { ignored: true, reason: 'booking_not_found' } })
      throw e
    }
    const agency = await api.getDoc(COL.agencies, booking.agencyId)

    /* ---------- Enregistrement du paiement (idempotent) ---------- */
    const paymentId = stableId('pay', provider, event.transactionId)
    const nowIso = new Date().toISOString()
    const paymentData = {
      bookingId: booking.$id,
      userId: booking.userId,
      agencyId: booking.agencyId,
      provider,
      method: event.method,
      amount: Math.round(event.amount),
      currency: event.currency,
      status: event.status,
      providerTransactionId: event.transactionId,
      providerRaw: raw.slice(0, 4900),
      paidAt: event.status === 'succeeded' ? nowIso : null,
      refundedAt: event.status === 'refunded' ? nowIso : null,
    }
    const permissions = [P.read(R.user(booking.userId)), P.read(R.team(agency.teamId)), P.read(R.label('superadmin'))]

    let previous = null
    try {
      await api.createDoc(COL.payments, paymentData, { id: paymentId, permissions })
    } catch (e) {
      if (!isConflict(e)) throw e
      previous = await api.getDoc(COL.payments, paymentId)
      // Même statut déjà traité : rien à refaire (le fournisseur peut renvoyer le message)
      if (previous.status === event.status) return res.json({ ok: true, data: { duplicate: true } })
      await api.updateDoc(COL.payments, paymentId, { status: event.status, paidAt: paymentData.paidAt, refundedAt: paymentData.refundedAt })
    }

    /* ---------- Mise à jour de la réservation ---------- */
    let paymentStatus = null
    if (event.status === 'succeeded') {
      if (event.currency !== booking.currency) {
        error(`Devise inattendue pour ${booking.reference} : ${event.currency}`)
      } else if (event.amount >= booking.totalAmount) {
        paymentStatus = 'paid'
      } else if (booking.paymentMode === 'deposit') {
        const offer = await api.getDoc(COL.offers, booking.offerId)
        const deposit = Math.round((booking.totalAmount * (offer.depositPercent || 0)) / 100)
        paymentStatus = deposit > 0 && event.amount >= deposit ? 'deposit_paid' : null
      }
      if (!paymentStatus) error(`Montant ${event.amount} insuffisant pour ${booking.reference} (total ${booking.totalAmount}).`)
    } else if (event.status === 'refunded') {
      paymentStatus = 'refunded'
    }

    if (paymentStatus) {
      await api.updateDoc(COL.bookings, booking.$id, { paymentStatus })
    }

    log(`Paiement ${event.transactionId} (${event.status}) -> réservation ${booking.reference} : ${paymentStatus ?? 'inchangée'}`)
    return res.json({ ok: true, data: { paymentStatus } })
  } catch (err) {
    // 500 : le fournisseur réessaiera plus tard
    return handleError(res, err, error)
  }
}