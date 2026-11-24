// functions/tour-booking-status/src/main.js — Vanessa Tourisme
//
// Change le statut d'une réservation. Règles :
//   - le TOURISTE (propriétaire) peut seulement ANNULER sa réservation avant la visite ;
//   - le PERSONNEL de l'agence (owner / admin / staff de la Team, ou label `superadmin`)
//     peut confirmer, refuser, annuler, terminer ou marquer « absent ».
//
// Corps : { bookingId, action: "confirm" | "reject" | "cancel" | "complete" | "no_show", reason? }
// Réponse : { ok: true, data: { booking } }
//
// Les notifications et e-mails sont envoyés par `tour-notify` (déclenché par la mise à jour).
import {
  COL,
  HttpError,
  agencyRole,
  assertConfig,
  canManageBookings,
  cleanText,
  createApi,
  fail,
  handleError,
  isId,
  isNotFound,
  isoToKey,
  ok,
  readBody,
  releaseSlot,
  requireUser,
  todayKey,
} from './utils.js'

const ACTIONS = ['confirm', 'reject', 'cancel', 'complete', 'no_show']
const OPEN_STATUSES = ['pending', 'confirmed']

/**
 * Transition autorisée pour une action donnée.
 * Renvoie le nouvel état à écrire, ou lève une erreur si l'action est impossible.
 */
export function planTransition({ action, booking, asStaff, asOwner, today, reason }) {
  const nowIso = new Date().toISOString()
  const visitKey = isoToKey(booking.visitDate)
  const wrongState = () =>
    new HttpError(409, 'INVALID_STATE', 'Cette action n’est plus possible pour cette réservation.')

  switch (action) {
    case 'confirm':
      if (!asStaff) throw new HttpError(403, 'FORBIDDEN', 'Action réservée à l’agence.')
      if (booking.status !== 'pending') throw wrongState()
      return { patch: { status: 'confirmed', confirmedAt: nowIso }, release: false }

    case 'reject':
      if (!asStaff) throw new HttpError(403, 'FORBIDDEN', 'Action réservée à l’agence.')
      if (booking.status !== 'pending') throw wrongState()
      return { patch: { status: 'rejected', cancelledAt: nowIso, cancelReason: reason }, release: true }

    case 'cancel': {
      if (!OPEN_STATUSES.includes(booking.status)) throw wrongState()
      // Le personnel de l'agence prime sur le statut de propriétaire
      if (asStaff) {
        return { patch: { status: 'cancelled_by_agency', cancelledAt: nowIso, cancelReason: reason }, release: true }
      }
      if (asOwner) {
        if (visitKey < today) throw new HttpError(409, 'VISIT_PAST', 'Cette visite est déjà passée.')
        return { patch: { status: 'cancelled_by_user', cancelledAt: nowIso, cancelReason: reason }, release: true }
      }
      throw new HttpError(403, 'FORBIDDEN', 'Vous ne pouvez pas annuler cette réservation.')
    }

    case 'complete':
    case 'no_show':
      if (!asStaff) throw new HttpError(403, 'FORBIDDEN', 'Action réservée à l’agence.')
      if (booking.status !== 'confirmed') throw wrongState()
      if (visitKey > today) {
        throw new HttpError(409, 'VISIT_FUTURE', 'La visite n’a pas encore eu lieu.')
      }
      return action === 'complete'
        ? { patch: { status: 'completed', completedAt: nowIso }, release: false }
        : { patch: { status: 'no_show' }, release: false }

    default:
      throw new HttpError(400, 'INVALID_INPUT', 'Action inconnue.')
  }
}

export default async ({ req, res, error }) => {
  try {
    if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Méthode non autorisée.')

    assertConfig()
    const api = createApi(req)
    const user = await requireUser(api, req)

    const body = readBody(req)
    if (!isId(body.bookingId)) throw new HttpError(400, 'INVALID_INPUT', 'Réservation invalide.')
    if (!ACTIONS.includes(body.action)) throw new HttpError(400, 'INVALID_INPUT', 'Action inconnue.')
    const reason = cleanText(body.reason, 500) || null

    let booking
    try {
      booking = await api.getDoc(COL.bookings, body.bookingId)
    } catch (e) {
      if (isNotFound(e)) throw new HttpError(404, 'NOT_FOUND', 'Réservation introuvable.')
      throw e
    }

    const asOwner = booking.userId === user.$id

    // Rôle dans l'équipe de l'agence
    let asStaff = false
    try {
      const agency = await api.getDoc(COL.agencies, booking.agencyId)
      asStaff = canManageBookings(await agencyRole(api, user, agency.teamId))
    } catch (e) {
      if (!isNotFound(e)) throw e
    }

    if (!asOwner && !asStaff) throw new HttpError(403, 'FORBIDDEN', 'Vous n’avez pas accès à cette réservation.')

    const { patch, release } = planTransition({
      action: body.action,
      booking,
      asStaff,
      asOwner,
      today: todayKey(),
      reason,
    })

    const updated = await api.updateDoc(COL.bookings, booking.$id, patch)

    // Les places du créneau sont rendues quand la réservation ne compte plus
    if (release && booking.availabilityId) {
      await releaseSlot(api, booking.availabilityId, booking.adults + booking.children, error)
    }

    return ok(res, { booking: updated })
  } catch (err) {
    return handleError(res, err, error)
  }
}