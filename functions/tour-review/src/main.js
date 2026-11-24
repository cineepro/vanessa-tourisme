// functions/tour-review/src/main.js — Vanessa Tourisme
//
// Trois routes (le site appelle la même function avec un chemin différent) :
//   POST /create    { bookingId, ratingSite, ratingGuide?, comment?, photos? }   -> touriste
//   POST /moderate  { reviewId, decision: "approve" | "reject" }                 -> personnel de l'agence
//   POST /reply     { reviewId, reply }                                          -> personnel de l'agence
// Réponse : { ok: true, data: { review } }
//
// Un avis est créé « en attente » (visible seulement de son auteur et de l'agence).
// À l'approbation, on ajoute la lecture publique, puis on recalcule la note du site et du guide.
import {
  COL,
  HttpError,
  P,
  Q,
  R,
  agencyRole,
  assertConfig,
  canManageBookings,
  cleanText,
  createApi,
  fail,
  handleError,
  isConflict,
  isId,
  isNotFound,
  listAll,
  ok,
  readBody,
  requireUser,
  toInt,
} from './utils.js'

const bad = (message) => new HttpError(400, 'INVALID_INPUT', message)

const mustGet = async (api, col, id, message) => {
  try {
    return await api.getDoc(col, id)
  } catch (e) {
    if (isNotFound(e)) throw new HttpError(404, 'NOT_FOUND', message)
    throw e
  }
}

/** "Kofi Mensah" -> "Kofi M." : jamais l'email ni le nom complet. */
export function shortName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Voyageur'
  if (parts.length === 1) return parts[0].slice(0, 40)
  return `${parts[0].slice(0, 30)} ${parts[parts.length - 1][0].toUpperCase()}.`
}

/** Permissions d'un avis : lecture publique seulement s'il est approuvé. */
export function reviewPermissions({ userId, teamId, isPublic }) {
  return [
    ...(isPublic ? [P.read(R.any)] : []),
    P.read(R.user(userId)),
    P.read(R.team(teamId)),
    P.read(R.label('superadmin')),
  ]
}

/** Recalcule la note moyenne d'un site ou d'un guide à partir des avis approuvés. */
async function recomputeRating(api, { targetCollection, targetId, filterField, ratingField }) {
  const approved = await listAll(api, COL.reviews, [Q.equal(filterField, targetId), Q.equal('status', 'approved')])
  const ratings = approved.map((r) => r[ratingField]).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5)
  const count = ratings.length
  const avg = count === 0 ? 0 : Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10
  try {
    await api.updateDoc(targetCollection, targetId, { ratingAvg: avg, ratingCount: count })
  } catch (e) {
    if (!isNotFound(e)) throw e
  }
  return { avg, count }
}

async function recomputeFor(api, review) {
  await recomputeRating(api, {
    targetCollection: COL.sites,
    targetId: review.siteId,
    filterField: 'siteId',
    ratingField: 'ratingSite',
  })
  if (review.guideId) {
    await recomputeRating(api, {
      targetCollection: COL.guides,
      targetId: review.guideId,
      filterField: 'guideId',
      ratingField: 'ratingGuide',
    })
  }
}

/* ============================================================
   /create
============================================================ */
async function createReview({ api, user, body }) {
  if (!isId(body.bookingId)) throw bad('Réservation invalide.')

  const ratingSite = toInt(body.ratingSite, { min: 1, max: 5 })
  if (ratingSite === null) throw bad('Donnez une note au site (de 1 à 5).')

  let ratingGuide = null
  if (body.ratingGuide !== undefined && body.ratingGuide !== null) {
    ratingGuide = toInt(body.ratingGuide, { min: 1, max: 5 })
    if (ratingGuide === null) throw bad('Note du guide invalide.')
  }

  const comment = cleanText(body.comment, 2000) || null

  let photos = []
  if (body.photos !== undefined && body.photos !== null) {
    if (!Array.isArray(body.photos) || body.photos.length > 4 || !body.photos.every(isId)) {
      throw bad('Photos invalides (4 maximum).')
    }
    photos = [...new Set(body.photos)]
  }

  const booking = await mustGet(api, COL.bookings, body.bookingId, 'Réservation introuvable.')
  if (booking.userId !== user.$id) throw new HttpError(403, 'FORBIDDEN', 'Cette réservation n’est pas la vôtre.')
  if (booking.status !== 'completed') {
    throw new HttpError(409, 'NOT_COMPLETED', 'Vous pourrez donner votre avis une fois la visite terminée.')
  }
  if (booking.reviewed) throw new HttpError(409, 'ALREADY_REVIEWED', 'Vous avez déjà donné votre avis sur cette visite.')

  const agency = await mustGet(api, COL.agencies, booking.agencyId, 'Agence introuvable.')

  let review
  try {
    review = await api.createDoc(
      COL.reviews,
      {
        userId: user.$id,
        bookingId: booking.$id,
        siteId: booking.siteId,
        guideId: ratingGuide !== null ? (booking.guideId ?? null) : (booking.guideId ?? null),
        agencyId: booking.agencyId,
        ratingSite,
        ratingGuide: booking.guideId ? ratingGuide : null,
        comment,
        photos,
        userDisplayName: shortName(user.name || booking.contactName),
        visitedAt: booking.visitDate,
        status: 'pending',
        agencyReply: null,
        agencyReplyAt: null,
      },
      { permissions: reviewPermissions({ userId: user.$id, teamId: agency.teamId, isPublic: false }) },
    )
  } catch (e) {
    // Index unique sur bookingId : un seul avis par réservation
    if (isConflict(e)) throw new HttpError(409, 'ALREADY_REVIEWED', 'Vous avez déjà donné votre avis sur cette visite.')
    throw e
  }

  await api.updateDoc(COL.bookings, booking.$id, { reviewed: true })
  return { review }
}

/* ============================================================
   /moderate et /reply : personnel de l'agence uniquement
============================================================ */
async function loadReviewAsStaff({ api, user, reviewId }) {
  if (!isId(reviewId)) throw bad('Avis invalide.')
  const review = await mustGet(api, COL.reviews, reviewId, 'Avis introuvable.')
  const agency = await mustGet(api, COL.agencies, review.agencyId, 'Agence introuvable.')
  if (!canManageBookings(await agencyRole(api, user, agency.teamId))) {
    throw new HttpError(403, 'FORBIDDEN', 'Action réservée à l’agence.')
  }
  return { review, agency }
}

async function moderateReview({ api, user, body }) {
  if (body.decision !== 'approve' && body.decision !== 'reject') throw bad('Décision inconnue.')
  const { review, agency } = await loadReviewAsStaff({ api, user, reviewId: body.reviewId })

  const approve = body.decision === 'approve'
  const updated = await api.updateDoc(
    COL.reviews,
    review.$id,
    { status: approve ? 'approved' : 'rejected' },
    reviewPermissions({ userId: review.userId, teamId: agency.teamId, isPublic: approve }),
  )

  await recomputeFor(api, review)
  return { review: updated }
}

async function replyToReview({ api, user, body }) {
  const reply = cleanText(body.reply, 1000)
  if (!reply) throw bad('Écrivez votre réponse.')

  const { review } = await loadReviewAsStaff({ api, user, reviewId: body.reviewId })
  if (review.status !== 'approved') throw new HttpError(409, 'NOT_APPROVED', 'Publiez d’abord cet avis pour y répondre.')

  const updated = await api.updateDoc(COL.reviews, review.$id, {
    agencyReply: reply,
    agencyReplyAt: new Date().toISOString(),
  })
  return { review: updated }
}

/* ============================================================ */
export default async ({ req, res, error }) => {
  try {
    if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Méthode non autorisée.')

    assertConfig()
    const api = createApi(req)
    const user = await requireUser(api, req)
    const body = readBody(req)
    const path = (req.path || '/').replace(/\/+$/, '') || '/'

    if (path === '/create') return ok(res, await createReview({ api, user, body }), 201)
    if (path === '/moderate') return ok(res, await moderateReview({ api, user, body }))
    if (path === '/reply') return ok(res, await replyToReview({ api, user, body }))

    return fail(res, 404, 'NOT_FOUND', 'Route inconnue.')
  } catch (err) {
    return handleError(res, err, error)
  }
}