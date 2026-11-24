// functions/tour-reminders/src/main.js — Vanessa Tourisme
//
// Planifiée (CRON) : chaque jour à 08h00 heure de Cotonou = 07:00 UTC  ->  "0 7 * * *"
// Envoie un rappel (notification + e-mail) aux touristes dont la visite CONFIRMÉE a lieu demain.
// Idempotente : relancer la function le même jour n'envoie jamais deux fois le même rappel.
import {
  COL,
  Q,
  addDaysKey,
  assertConfig,
  createApi,
  createNotification,
  emailTemplate,
  formatVisitDate,
  isNotFound,
  keyToIso,
  listAll,
  sendEmail,
  todayKey,
} from './utils.js'

export default async ({ req, res, log, error }) => {
  try {
    assertConfig()
    const api = createApi(req)

    const tomorrow = addDaysKey(todayKey(), 1)

    // Filtre sur la date seulement (index `visitDate`), le statut est contrôlé ensuite
    const candidates = await listAll(api, COL.bookings, [
      Q.greaterThanEqual('visitDate', keyToIso(tomorrow)),
      Q.lessThanEqual('visitDate', `${tomorrow}T23:59:59.999Z`),
    ])
    const bookings = candidates.filter((b) => b.status === 'confirmed')

    let sent = 0
    for (const booking of bookings) {
      try {
        const site = booking.siteName || 'votre visite'
        const when = `${formatVisitDate(booking.visitDate)}${booking.startTime ? ` à ${booking.startTime}` : ''}`

        // Point de rendez-vous de l'offre, s'il existe
        let meeting = null
        try {
          meeting = (await api.getDoc(COL.offers, booking.offerId)).meetingPoint || null
        } catch (e) {
          if (!isNotFound(e)) throw e
        }

        const body = `${site}, ${when}.${meeting ? ` Rendez-vous : ${meeting}.` : ''} Présentez votre QR code à votre guide.`
        const created = await createNotification(api, {
          userId: booking.userId,
          type: 'booking_reminder',
          title: 'Rappel : votre visite est demain',
          body,
          link: `/mes-reservations/${booking.$id}`,
          bookingId: booking.$id,
        })

        if (created) {
          sent += 1
          let email = booking.contactEmail || null
          if (!email) {
            try {
              email = (await api.getUser(booking.userId)).email || null
            } catch (e) {
              if (!isNotFound(e)) throw e
            }
          }
          if (email) {
            await sendEmail(
              {
                to: email,
                subject: `Rappel : votre visite de ${site} est demain`,
                html: emailTemplate({
                  title: 'Votre visite est demain',
                  lines: [body, `Référence : ${booking.reference}`],
                  buttonLabel: 'Voir mon billet',
                  link: `/mes-reservations/${booking.$id}`,
                }),
              },
              error,
            )
          }
        }
      } catch (e) {
        // Un échec sur une réservation ne doit pas bloquer les autres
        error(`[tour-reminders] ${booking.$id} : ${e?.stack || e}`)
      }
    }

    log(`Rappels du ${tomorrow} : ${sent} envoyé(s) sur ${bookings.length} réservation(s) confirmée(s).`)
    return res.json({ ok: true, data: { date: tomorrow, confirmed: bookings.length, sent } })
  } catch (err) {
    error(`[tour-reminders] ${err?.stack || err}`)
    return res.json({ ok: false, error: 'reminders_failed' }, 500)
  }
}