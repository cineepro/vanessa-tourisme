// functions/tour-notify/src/main.js — Vanessa Tourisme
//
// Déclenchée par ÉVÉNEMENT à chaque création ou mise à jour d'une réservation :
//   databases.<DATABASE_ID>.collections.<ID_tour_bookings>.documents.*.create
//   databases.<DATABASE_ID>.collections.<ID_tour_bookings>.documents.*.update
//
// Elle crée les notifications dans l'application (collection `tour_notifications`) et envoie
// les e-mails (Resend). Chaque notification a un ID déterministe (réservation + destinataire + type) :
// un même événement reçu deux fois ne produit donc jamais de doublon.
import {
  COL,
  P,
  Q,
  R,
  assertConfig,
  createApi,
  createNotification,
  emailTemplate,
  formatMoney,
  formatVisitDate,
  isNotFound,
  readBody,
  sendEmail,
  stableId,
  isConflict,
} from './utils.js'

const OWNER_ROLES = ['owner', 'admin', 'staff']

/** Notification à destination du touriste, selon le statut courant de la réservation. */
export function userMessageFor(booking) {
  const site = booking.siteName || 'votre visite'
  const when = `${formatVisitDate(booking.visitDate)}${booking.startTime ? ` à ${booking.startTime}` : ''}`
  const link = `/mes-reservations/${booking.$id}`

  switch (booking.status) {
    case 'pending':
      return {
        type: 'booking_pending',
        title: 'Demande de réservation envoyée',
        body: `${site}, ${when}. L’agence va la confirmer très bientôt.`,
        link,
        mail: { subject: `Demande reçue : ${site} (${booking.reference})`, button: 'Voir ma réservation' },
      }
    case 'confirmed':
      return {
        type: 'booking_confirmed',
        title: 'Réservation confirmée',
        body: `${site}, ${when}. Votre billet avec QR code est prêt.`,
        link,
        mail: { subject: `Réservation confirmée : ${site} (${booking.reference})`, button: 'Voir mon billet' },
      }
    case 'rejected':
      return {
        type: 'booking_rejected',
        title: 'Réservation refusée',
        body: `${site}, ${when}.${booking.cancelReason ? ` Motif : ${booking.cancelReason}` : ' L’agence n’a pas pu l’accepter.'}`,
        link,
        mail: { subject: `Réservation refusée : ${site} (${booking.reference})`, button: 'Voir les détails' },
      }
    case 'cancelled_by_agency':
      return {
        type: 'booking_cancelled',
        title: 'Réservation annulée par l’agence',
        body: `${site}, ${when}.${booking.cancelReason ? ` Motif : ${booking.cancelReason}` : ''}`.trim(),
        link,
        mail: { subject: `Réservation annulée : ${site} (${booking.reference})`, button: 'Voir les détails' },
      }
    case 'cancelled_by_user':
      return {
        type: 'booking_cancelled',
        title: 'Annulation enregistrée',
        body: `Votre réservation ${booking.reference} pour ${site} est annulée.`,
        link,
        mail: { subject: `Annulation enregistrée (${booking.reference})`, button: 'Voir les détails' },
      }
    case 'completed':
      return {
        type: 'review_request',
        title: 'Comment s’est passée votre visite ?',
        body: `Partagez votre avis sur ${site} pour aider les prochains voyageurs.`,
        link,
        mail: { subject: `Votre avis sur ${site}`, button: 'Donner mon avis' },
      }
    default:
      return null
  }
}

/** Notification à destination du personnel de l'agence. */
export function agencyMessageFor(booking) {
  const site = booking.siteName || 'une visite'
  const when = `${formatVisitDate(booking.visitDate)}${booking.startTime ? ` à ${booking.startTime}` : ''}`
  const who = `${booking.contactName} (${booking.adults + booking.children} pers.)`
  const link = '/agence/reservations'

  switch (booking.status) {
    case 'pending':
      return {
        type: 'booking_pending',
        title: 'Nouvelle réservation à confirmer',
        body: `${who} · ${site}, ${when} · ${formatMoney(booking.totalAmount, booking.currency)}`,
        link,
        mail: { subject: `Nouvelle réservation à confirmer : ${site} (${booking.reference})`, button: 'Ouvrir les réservations' },
      }
    case 'confirmed':
      return {
        type: 'booking_confirmed',
        title: 'Nouvelle réservation confirmée',
        body: `${who} · ${site}, ${when} · ${formatMoney(booking.totalAmount, booking.currency)}`,
        link,
        mail: { subject: `Nouvelle réservation : ${site} (${booking.reference})`, button: 'Ouvrir les réservations' },
      }
    case 'cancelled_by_user':
      return {
        type: 'booking_cancelled',
        title: 'Réservation annulée par le client',
        body: `${who} · ${site}, ${when}`,
        link,
        mail: { subject: `Annulation client : ${site} (${booking.reference})`, button: 'Ouvrir les réservations' },
      }
    default:
      return null
  }
}

/** Corps de l'e-mail à partir de la notification. */
const buildMail = (message, booking) =>
  emailTemplate({
    title: message.title,
    lines: [message.body, `Référence : ${booking.reference}`],
    buttonLabel: message.mail.button,
    link: message.link,
  })

/** Crée la notification (une seule fois) puis l'e-mail. */
async function notify(api, { userId, message, booking, email }, logError) {
  const created = await createNotification(api, {
    userId,
    type: message.type,
    title: message.title,
    body: message.body,
    link: message.link,
    bookingId: booking.$id,
  })
  if (created && email) {
    await sendEmail({ to: email, subject: message.mail.subject, html: buildMail(message, booking) }, logError)
  }
  return created
}

export default async ({ req, res, log, error }) => {
  try {
    assertConfig()
    const booking = readBody(req)

    // Ne traite que les documents de réservation (garde-fou si l'événement est mal configuré)
    if (!booking || !booking.$id || !booking.userId || !booking.status) {
      log('Événement ignoré : ce n’est pas une réservation.')
      return res.json({ ok: true, data: { skipped: true } })
    }

    const api = createApi(req)
    const results = { user: false, agency: 0 }

    /* ---------- Touriste ---------- */
    const userMessage = userMessageFor(booking)
    if (userMessage) {
      let email = booking.contactEmail || null
      if (!email) {
        try {
          email = (await api.getUser(booking.userId)).email || null
        } catch (e) {
          if (!isNotFound(e)) throw e
        }
      }
      results.user = await notify(api, { userId: booking.userId, message: userMessage, booking, email }, error)
    }

    /* ---------- Agence : membres de l'équipe + e-mail de l'agence ---------- */
    const agencyMessage = agencyMessageFor(booking)
    if (agencyMessage) {
      let agency = null
      try {
        agency = await api.getDoc(COL.agencies, booking.agencyId)
      } catch (e) {
        if (!isNotFound(e)) throw e
      }

      if (agency) {
        const memberships = await api.listMemberships(agency.teamId, [Q.limit(100)])
        const members = (memberships.memberships || []).filter(
          (m) => m.confirm !== false && (m.roles || []).some((r) => OWNER_ROLES.includes(r)),
        )

        for (const member of members) {
          if (!member.userId || member.userId === booking.userId) continue
          if (await notify(api, { userId: member.userId, message: agencyMessage, booking, email: null }, error)) {
            results.agency += 1
          }
        }

        // Un seul e-mail à l'adresse de l'agence, envoyé une fois (marqueur idempotent)
        if (agency.email) {
          const markerId = stableId('agency-mail', booking.$id, agencyMessage.type, agency.$id)
          try {
            await api.createDoc(
              COL.notifications,
              {
                userId: agency.teamId,
                type: agencyMessage.type,
                title: `[courrier agence] ${agencyMessage.title}`,
                body: null,
                link: null,
                bookingId: booking.$id,
                isRead: true,
              },
              { id: markerId, permissions: [] },
            )
            await sendEmail(
              { to: agency.email, subject: agencyMessage.mail.subject, html: buildMail(agencyMessage, booking) },
              error,
            )
          } catch (e) {
            if (!isConflict(e)) throw e
          }
        }
      }
    }

    log(`Réservation ${booking.reference} (${booking.status}) : touriste=${results.user}, agence=${results.agency}`)
    return res.json({ ok: true, data: results })
  } catch (err) {
    // Une erreur ici ne doit jamais casser la réservation : elle est seulement journalisée
    error(`[tour-notify] ${err?.stack || err}`)
    return res.json({ ok: false, error: 'notify_failed' }, 500)
  }
}

export { P, R }