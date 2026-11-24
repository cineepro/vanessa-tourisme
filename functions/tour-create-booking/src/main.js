// functions/tour-create-booking/src/main.js — Vanessa Tourisme
//
// Crée une réservation. Le navigateur ne peut JAMAIS écrire directement dans `tour_bookings` :
// le prix, la capacité des créneaux et les règles de l'offre sont tous recalculés ici.
//
// Appelée par le site (services/bookings.service.ts) avec le corps :
//   { offerId, availabilityId?, visitDate: "YYYY-MM-DD", startTime?, adults, children?,
//     contactName, contactPhone, contactEmail?, nationality?, pickupLocation?, specialRequests?, source? }
// Réponse : { ok: true, data: { booking } }
import {
  COL,
  HttpError,
  P,
  R,
  addDaysKey,
  assertConfig,
  cleanText,
  createApi,
  endOfDayWAT,
  handleError,
  isConflict,
  isEmail,
  isId,
  isNotFound,
  isValidDateKey,
  keyToIso,
  makeReference,
  newToken,
  normalizePhone,
  ok,
  readBody,
  releaseSlot,
  requireUser,
  reserveSlot,
  toInt,
  todayKey,
  weekdayOf,
  fail,
} from './utils.js'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const MAX_DAYS_AHEAD = 365

const bad = (message) => new HttpError(400, 'INVALID_INPUT', message)

/** Valide et nettoie le corps de la requête. */
function parseInput(body) {
  if (!isId(body.offerId)) throw bad('Prestation invalide.')

  if (!isValidDateKey(body.visitDate)) throw bad('Date de visite invalide.')

  const adults = toInt(body.adults, { min: 1, max: 50 })
  if (adults === null) throw bad('Indiquez au moins un adulte.')
  const children = body.children === undefined ? 0 : toInt(body.children, { min: 0, max: 50 })
  if (children === null) throw bad('Nombre d’enfants invalide.')

  const contactName = cleanText(body.contactName, 128)
  if (contactName.length < 2) throw bad('Indiquez votre nom complet.')

  const contactPhone = normalizePhone(body.contactPhone)
  if (!contactPhone) throw bad('Numéro de téléphone invalide.')

  let contactEmail = null
  if (body.contactEmail !== undefined && body.contactEmail !== '') {
    if (!isEmail(body.contactEmail)) throw bad('Adresse email invalide.')
    contactEmail = body.contactEmail.trim()
  }

  let startTime = null
  if (body.startTime !== undefined && body.startTime !== null && body.startTime !== '') {
    if (typeof body.startTime !== 'string' || !TIME.test(body.startTime)) throw bad('Heure de départ invalide.')
    startTime = body.startTime
  }

  if (body.availabilityId !== undefined && body.availabilityId !== null && !isId(body.availabilityId)) {
    throw bad('Créneau invalide.')
  }

  return {
    offerId: body.offerId,
    availabilityId: body.availabilityId || null,
    visitDate: body.visitDate,
    startTime,
    adults,
    children,
    contactName,
    contactPhone,
    contactEmail,
    nationality: cleanText(body.nationality, 64) || null,
    pickupLocation: cleanText(body.pickupLocation, 255) || null,
    specialRequests: cleanText(body.specialRequests, 1000) || null,
    // `agency_manual` est réservé à l'espace agence : jamais accepté d'un client
    source: body.source === 'vanessa_chat' ? 'vanessa_chat' : 'site',
  }
}

/** Prix officiel (le site n'affiche qu'un aperçu). */
function computePrice(offer, slot, adults, children) {
  const base = slot?.priceOverride ?? offer.price
  if (offer.pricingType === 'per_group') {
    return { unitPrice: base, childUnitPrice: null, total: base }
  }
  const child = offer.childPrice ?? base
  return { unitPrice: base, childUnitPrice: child, total: adults * base + children * child }
}

/** Charge un document ou lève une erreur 404 lisible. */
async function mustGet(api, col, id, message) {
  try {
    return await api.getDoc(col, id)
  } catch (e) {
    if (isNotFound(e)) throw new HttpError(404, 'NOT_FOUND', message)
    throw e
  }
}

export default async ({ req, res, log, error }) => {
  try {
    if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Méthode non autorisée.')

    assertConfig()
    const api = createApi(req)
    const user = await requireUser(api, req)
    const input = parseInput(readBody(req))

    // Compte banni sur Vanessa (collection `users` partagée) : réservation refusée
    if (COL.users) {
      try {
        const profile = await api.getDoc(COL.users, user.$id)
        if (profile.isBanned) throw new HttpError(403, 'ACCOUNT_BANNED', 'Ce compte ne peut pas effectuer de réservation.')
      } catch (e) {
        // Pas de document `users` : on laisse passer. Toute autre erreur (dont le refus ci-dessus) remonte.
        if (!isNotFound(e)) throw e
      }
    }

    /* ---------- Prestation, agence, site ---------- */
    const offer = await mustGet(api, COL.offers, input.offerId, 'Cette prestation est introuvable.')
    if (!offer.isActive) throw new HttpError(409, 'OFFER_INACTIVE', 'Cette prestation n’est plus disponible.')

    const agency = await mustGet(api, COL.agencies, offer.agencyId, 'Cette agence est introuvable.')
    const licenseOk =
      agency.isActive &&
      ['trial', 'active'].includes(agency.licenseStatus) &&
      !(agency.licenseEndsAt && new Date(agency.licenseEndsAt) < new Date())
    if (!licenseOk) {
      throw new HttpError(409, 'AGENCY_UNAVAILABLE', 'Cette agence n’accepte pas de réservation pour le moment.')
    }

    const site = await mustGet(api, COL.sites, offer.siteId, 'Ce site est introuvable.')
    if (site.status !== 'published') {
      throw new HttpError(409, 'SITE_UNAVAILABLE', 'Ce site n’est pas ouvert à la réservation.')
    }

    let guideName = null
    if (offer.guideId) {
      try {
        guideName = (await api.getDoc(COL.guides, offer.guideId)).fullName ?? null
      } catch (e) {
        if (!isNotFound(e)) throw e
      }
    }

    /* ---------- Date ---------- */
    const today = todayKey()
    if (input.visitDate < today) throw new HttpError(409, 'DATE_PAST', 'Cette date est passée.')
    if (input.visitDate > addDaysKey(today, MAX_DAYS_AHEAD)) {
      throw new HttpError(409, 'DATE_TOO_FAR', 'Cette date est trop lointaine pour être réservée.')
    }
    if ((offer.closedWeekdays || []).includes(weekdayOf(input.visitDate))) {
      throw new HttpError(409, 'DAY_CLOSED', 'Ce jour-là, la visite n’est pas disponible.')
    }
    const earliest = Date.now() + (offer.leadTimeHours || 0) * 3_600_000
    if (endOfDayWAT(input.visitDate).getTime() < earliest) {
      throw new HttpError(409, 'LEAD_TIME', `Cette visite doit être réservée au moins ${offer.leadTimeHours} h à l’avance.`)
    }

    /* ---------- Participants ---------- */
    const people = input.adults + input.children
    if (people < offer.minParticipants) {
      throw new HttpError(409, 'TOO_FEW', `Cette visite demande au moins ${offer.minParticipants} participant(s).`)
    }
    if (people > offer.maxParticipants) {
      throw new HttpError(409, 'TOO_MANY', `Cette visite accepte ${offer.maxParticipants} participants au maximum.`)
    }

    /* ---------- Créneau (mode "slots") ---------- */
    let slot = null
    let startTime = input.startTime
    if (offer.bookingMode === 'slots') {
      if (!input.availabilityId) throw new HttpError(400, 'SLOT_REQUIRED', 'Choisissez un horaire.')
      slot = await mustGet(api, COL.availabilities, input.availabilityId, 'Ce créneau est introuvable.')
      if (slot.offerId !== offer.$id || slot.dateKey !== input.visitDate) {
        throw new HttpError(409, 'SLOT_MISMATCH', 'Ce créneau ne correspond pas à votre sélection.')
      }
      if (slot.status !== 'open') throw new HttpError(409, 'SLOT_CLOSED', 'Ce créneau n’est plus disponible.')
      startTime = slot.startTime
    }

    const price = computePrice(offer, slot, input.adults, input.children)

    /* ---------- Réservation de la capacité, puis création ---------- */
    if (slot) await reserveSlot(api, slot.$id, people)

    const confirmedNow = offer.instantConfirm === true
    const nowIso = new Date().toISOString()
    const permissions = [
      P.read(R.user(user.$id)),
      P.read(R.team(agency.teamId)),
      P.read(R.label('superadmin')),
      P.update(R.team(agency.teamId)),
      P.update(R.label('superadmin')),
    ]

    const data = {
      userId: user.$id,
      agencyId: agency.$id,
      offerId: offer.$id,
      siteId: site.$id,
      guideId: offer.guideId ?? null,
      availabilityId: slot ? slot.$id : null,
      siteName: site.name,
      guideName,
      offerTitle: offer.title,
      visitDate: keyToIso(input.visitDate),
      startTime,
      adults: input.adults,
      children: input.children,
      unitPrice: price.unitPrice,
      childUnitPrice: price.childUnitPrice,
      totalAmount: price.total,
      currency: offer.currency,
      status: confirmedNow ? 'confirmed' : 'pending',
      paymentStatus: 'unpaid',
      paymentMode: offer.paymentMode ?? 'on_site',
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      nationality: input.nationality,
      pickupLocation: input.pickupLocation,
      specialRequests: input.specialRequests,
      source: input.source,
      qrToken: newToken(),
      confirmedAt: confirmedNow ? nowIso : null,
      cancelledAt: null,
      completedAt: null,
      cancelReason: null,
      reviewed: false,
    }

    let booking = null
    try {
      for (let attempt = 0; attempt < 6 && !booking; attempt += 1) {
        try {
          booking = await api.createDoc(COL.bookings, { ...data, reference: makeReference() }, { permissions })
        } catch (e) {
          // Référence déjà prise (index unique) : on en tire une autre
          if (!(isConflict(e) && attempt < 5)) throw e
        }
      }
    } catch (e) {
      if (slot) await releaseSlot(api, slot.$id, people, error)
      throw e
    }

    log(`Réservation ${booking.reference} créée (${booking.status}) pour l'utilisateur ${user.$id}`)
    return ok(res, { booking }, 201)
  } catch (err) {
    return handleError(res, err, error)
  }
}

// Utilisé par les tests locaux
export { computePrice, parseInput }