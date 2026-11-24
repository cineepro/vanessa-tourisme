// functions/_shared/utils.js — Vanessa Tourisme
// Module partagé : ce fichier est COPIÉ à l'identique dans src/utils.js de chaque function
// (une function Appwrite est déployée seule, elle ne peut pas importer un dossier voisin).
//
// Il parle à Appwrite directement par l'API REST (fetch) : aucune dépendance npm,
// donc aucun souci de version de SDK.
import { createHash, randomBytes, randomInt } from 'node:crypto'

/* ============================================================
   Erreurs
============================================================ */
/** Erreur "métier" : son message est montré au touriste. */
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

/** Erreur renvoyée par l'API Appwrite (le message reste dans les journaux, jamais au client). */
export class ApiError extends Error {
  constructor(status, type, message) {
    super(message || `Appwrite ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.type = type
  }
}

export const isNotFound = (e) => e instanceof ApiError && e.status === 404
export const isConflict = (e) => e instanceof ApiError && e.status === 409

/* ============================================================
   Configuration (variables d'environnement de la function)
============================================================ */
const env = process.env

export const CONFIG = {
  // Injectés automatiquement par Appwrite dans toutes les functions
  endpoint: (env.APPWRITE_FUNCTION_API_ENDPOINT || env.APPWRITE_ENDPOINT || '').replace(/\/$/, ''),
  projectId: env.APPWRITE_FUNCTION_PROJECT_ID || env.APPWRITE_PROJECT_ID || '',
  // À définir dans chaque function
  databaseId: env.DATABASE_ID || '',
  appUrl: (env.APP_URL || '').replace(/\/$/, ''),
}

/** IDs des collections : la valeur par défaut est l'ID `tour_...` (voir guide de déploiement). */
export const COL = {
  users: env.COLLECTION_USERS || '',
  agencies: env.COLLECTION_TOUR_AGENCIES || 'tour_agencies',
  profiles: env.COLLECTION_TOUR_PROFILES || 'tour_profiles',
  sites: env.COLLECTION_TOUR_SITES || 'tour_sites',
  guides: env.COLLECTION_TOUR_GUIDES || 'tour_guides',
  offers: env.COLLECTION_TOUR_OFFERS || 'tour_offers',
  availabilities: env.COLLECTION_TOUR_AVAILABILITIES || 'tour_availabilities',
  bookings: env.COLLECTION_TOUR_BOOKINGS || 'tour_bookings',
  payments: env.COLLECTION_TOUR_PAYMENTS || 'tour_payments',
  reviews: env.COLLECTION_TOUR_REVIEWS || 'tour_reviews',
  conversations: env.COLLECTION_TOUR_CONVERSATIONS || 'tour_conversations',
  messages: env.COLLECTION_TOUR_MESSAGES || 'tour_messages',
  places: env.COLLECTION_TOUR_PLACES || 'tour_places',
  articles: env.COLLECTION_TOUR_ARTICLES || 'tour_articles',
  notifications: env.COLLECTION_TOUR_NOTIFICATIONS || 'tour_notifications',
  chatUsage: env.COLLECTION_TOUR_CHAT_USAGE || 'tour_chat_usage',
}

export function assertConfig() {
  const missing = []
  if (!CONFIG.endpoint) missing.push('APPWRITE_FUNCTION_API_ENDPOINT')
  if (!CONFIG.projectId) missing.push('APPWRITE_FUNCTION_PROJECT_ID')
  if (!CONFIG.databaseId) missing.push('DATABASE_ID')
  if (missing.length > 0) {
    throw new HttpError(500, 'CONFIG', `Configuration incomplète : variable(s) manquante(s) : ${missing.join(', ')}.`)
  }
}

/* ============================================================
   Requêtes (format JSON des "Query" Appwrite)
============================================================ */
const wrap = (v) => (Array.isArray(v) ? v : [v])

export const Q = {
  equal: (attribute, value) => JSON.stringify({ method: 'equal', attribute, values: wrap(value) }),
  notEqual: (attribute, value) => JSON.stringify({ method: 'notEqual', attribute, values: wrap(value) }),
  greaterThanEqual: (attribute, value) => JSON.stringify({ method: 'greaterThanEqual', attribute, values: [value] }),
  lessThanEqual: (attribute, value) => JSON.stringify({ method: 'lessThanEqual', attribute, values: [value] }),
  startsWith: (attribute, value) => JSON.stringify({ method: 'startsWith', attribute, values: [value] }),
  search: (attribute, value) => JSON.stringify({ method: 'search', attribute, values: [value] }),
  orderAsc: (attribute) => JSON.stringify({ method: 'orderAsc', attribute }),
  orderDesc: (attribute) => JSON.stringify({ method: 'orderDesc', attribute }),
  limit: (n) => JSON.stringify({ method: 'limit', values: [n] }),
  cursorAfter: (id) => JSON.stringify({ method: 'cursorAfter', values: [id] }),
  /** Au moins un des filtres (déjà sérialisés par Q.*). */
  or: (queries) => JSON.stringify({ method: 'or', values: queries.map((q) => JSON.parse(q)) }),
}

/** `Q.or` exige 2 filtres au minimum : un seul est renvoyé tel quel. */
export const anyOf = (queries) => (queries.length === 1 ? queries[0] : Q.or(queries))

/* ============================================================
   Permissions
============================================================ */
export const R = {
  any: 'any',
  users: 'users',
  user: (id) => `user:${id}`,
  team: (id, role) => (role ? `team:${id}/${role}` : `team:${id}`),
  label: (name) => `label:${name}`,
}
export const P = {
  read: (role) => `read("${role}")`,
  update: (role) => `update("${role}")`,
  delete: (role) => `delete("${role}")`,
}

/* ============================================================
   Client Appwrite (REST)
============================================================ */
export function createApi(req) {
  // Clé dynamique fournie par Appwrite (selon les « Scopes » de la function), sinon clé manuelle
  const key = (req?.headers && req.headers['x-appwrite-key']) || env.APPWRITE_API_KEY || ''
  if (!key) {
    throw new HttpError(
      500,
      'CONFIG',
      'Aucune clé API : cochez les « Scopes » de la function ou définissez la variable APPWRITE_API_KEY.',
    )
  }

  async function call(method, path, { query, body } = {}) {
    const url = new URL(CONFIG.endpoint + path)
    for (const [name, value] of query ?? []) url.searchParams.append(name, value)

    const res = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-appwrite-project': CONFIG.projectId,
        'x-appwrite-key': key,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const text = await res.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = null
    }
    if (!res.ok) throw new ApiError(res.status, data?.type, data?.message || text)
    return data
  }

  const docs = (col, id) =>
    `/databases/${CONFIG.databaseId}/collections/${col}/documents${id ? `/${encodeURIComponent(id)}` : ''}`

  return {
    getDoc: (col, id) => call('GET', docs(col, id)),

    listDocs: (col, queries = []) =>
      call('GET', docs(col), { query: queries.map((q) => ['queries[]', q]) }),

    createDoc: (col, data, { id, permissions } = {}) =>
      call('POST', docs(col), { body: { documentId: id || 'unique()', data, permissions } }),

    updateDoc: (col, id, data, permissions) =>
      call('PATCH', docs(col, id), { body: permissions ? { data, permissions } : { data } }),

    deleteDoc: (col, id) => call('DELETE', docs(col, id)),

    /** Incrément atomique côté serveur (plafonné par `max`). Lève ApiError si non supporté ou dépassé. */
    increment: (col, id, attribute, value, max) =>
      call('PATCH', `${docs(col, id)}/${attribute}/increment`, {
        body: max === undefined ? { value } : { value, max },
      }),

    getUser: (id) => call('GET', `/users/${encodeURIComponent(id)}`),

    listMemberships: (teamId, queries = []) =>
      call('GET', `/teams/${encodeURIComponent(teamId)}/memberships`, {
        query: queries.map((q) => ['queries[]', q]),
      }),
  }
}

/** Parcourt toutes les pages d'une liste (100 par page). */
export async function listAll(api, col, queries = [], max = 1000) {
  const out = []
  let cursor = null
  while (out.length < max) {
    const page = await api.listDocs(col, [
      ...queries,
      Q.limit(100),
      ...(cursor ? [Q.cursorAfter(cursor)] : []),
    ])
    out.push(...page.documents)
    if (page.documents.length < 100) break
    cursor = page.documents[page.documents.length - 1].$id
  }
  return out
}

/* ============================================================
   Requête / réponse
============================================================ */
export function readBody(req) {
  if (req.bodyJson && typeof req.bodyJson === 'object') return req.bodyJson
  const raw = typeof req.bodyText === 'string' ? req.bodyText : typeof req.body === 'string' ? req.body : ''
  if (!raw) return typeof req.body === 'object' && req.body ? req.body : {}
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'BAD_JSON', 'Requête invalide.')
  }
}

/** Réponse de succès : { ok: true, data } (format attendu par le site). */
export const ok = (res, data, status = 200) => res.json({ ok: true, data }, status)

/** Réponse d'erreur : { ok: false, error, code }. */
export const fail = (res, status, code, message) => res.json({ ok: false, error: message, code }, status)

/** Convertit n'importe quelle erreur en réponse propre (les détails techniques vont dans les journaux). */
export function handleError(res, err, logError = console.error) {
  if (err instanceof HttpError) return fail(res, err.status, err.code, err.message)
  logError(`[erreur] ${err?.stack || err}`)
  return fail(res, 500, 'SERVER_ERROR', 'Une erreur est survenue. Réessayez dans un instant.')
}

/* ============================================================
   Identité de l'appelant (en-têtes posés par Appwrite, non falsifiables)
============================================================ */
export const callerId = (req) => (req.headers && req.headers['x-appwrite-user-id']) || ''
export const trigger = (req) => (req.headers && req.headers['x-appwrite-trigger']) || ''

/** Exige un utilisateur connecté, actif et dont l'email est vérifié. */
export async function requireUser(api, req) {
  const id = callerId(req)
  if (!id) throw new HttpError(401, 'UNAUTHENTICATED', 'Connexion requise.')

  let user
  try {
    user = await api.getUser(id)
  } catch (e) {
    if (isNotFound(e)) throw new HttpError(401, 'UNAUTHENTICATED', 'Connexion requise.')
    throw e
  }
  if (user.status === false) throw new HttpError(403, 'ACCOUNT_BLOCKED', 'Ce compte est désactivé.')
  if (!user.emailVerification) {
    throw new HttpError(403, 'EMAIL_NOT_VERIFIED', 'Veuillez d’abord confirmer votre adresse email.')
  }
  return user
}

/**
 * Rôle de l'utilisateur dans l'équipe d'une agence : 'owner' | 'admin' | 'staff' | 'guide' | null.
 * Le label `superadmin` donne 'superadmin'.
 */
export async function agencyRole(api, user, teamId) {
  if (Array.isArray(user.labels) && user.labels.includes('superadmin')) return 'superadmin'
  const list = await api.listMemberships(teamId, [Q.equal('userId', user.$id), Q.limit(1)])
  const membership = list.memberships?.[0]
  if (!membership || membership.confirm === false) return null
  return (membership.roles || []).find((r) => ['owner', 'admin', 'staff', 'guide'].includes(r)) ?? null
}

export const canManageBookings = (role) => ['superadmin', 'owner', 'admin', 'staff'].includes(role)

/* ============================================================
   Validation
============================================================ */
export const cleanText = (value, max) =>
  typeof value === 'string' ? value.replace(/\u0000/g, '').trim().slice(0, max) : ''

export const isId = (value) => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(value)

export const isEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

/** "+229 01 23 45 67 89" -> "+2290123456789" ; null si invalide. */
export function normalizePhone(raw) {
  if (typeof raw !== 'string') return null
  const cleaned = raw.replace(/[\s().-]/g, '')
  const withPlus = cleaned.startsWith('00') ? `+${cleaned.slice(2)}` : cleaned
  return /^\+?[0-9]{8,15}$/.test(withPlus) ? withPlus : null
}

/** Entier dans [min, max] (accepte "3"), sinon null. */
export function toInt(value, { min, max }) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

/* ============================================================
   Dates (Bénin : UTC+1 toute l'année, pas d'heure d'été)
============================================================ */
const WAT_MS = 3_600_000

/** Date du jour "YYYY-MM-DD" à Cotonou. */
export const todayKey = () => new Date(Date.now() + WAT_MS).toISOString().slice(0, 10)

export function isValidDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false
  try {
    return new Date(`${key}T00:00:00Z`).toISOString().slice(0, 10) === key
  } catch {
    return false
  }
}

export function addDaysKey(key, days) {
  const d = new Date(`${key}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const weekdayOf = (key) => new Date(`${key}T00:00:00Z`).getUTCDay()
export const endOfDayWAT = (key) => new Date(`${key}T23:59:59+01:00`)
export const keyToIso = (key) => `${key}T00:00:00.000Z`
export const isoToKey = (iso) => String(iso).slice(0, 10)

/** "jeudi 19 novembre 2026" (la date de visite est stockée à minuit UTC). */
export const formatVisitDate = (iso) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(iso))

export function formatMoney(amount, currency = 'XOF') {
  const digits = currency === 'XOF' ? 0 : 2
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
    .format(amount)
    .replace(/[\u202f\u00a0]/g, ' ')
}

/* ============================================================
   Identifiants et jetons
============================================================ */
/** ID déterministe (32 hex) : permet l'idempotence sans index (un 2e create renvoie 409). */
export const stableId = (...parts) => createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 32)

export const newToken = () => randomBytes(16).toString('hex')

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Référence lisible : VT-2611-A7K2 (année+mois, 4 caractères sans ambiguïté). */
export function makeReference() {
  const now = new Date(Date.now() + WAT_MS)
  const yymm = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  let suffix = ''
  for (let i = 0; i < 4; i += 1) suffix += REF_CHARS[randomInt(REF_CHARS.length)]
  return `VT-${yymm}-${suffix}`
}

/* ============================================================
   Capacité des créneaux (offres en mode "slots")
============================================================ */
const slotFull = () => new HttpError(409, 'SLOT_FULL', 'Ce créneau n’a plus assez de places. Choisissez un autre horaire.')

/** Réserve `delta` places. Incrément atomique si disponible, sinon lecture-écriture. */
export async function reserveSlot(api, slotId, delta) {
  const col = COL.availabilities
  const slot = await api.getDoc(col, slotId)
  if (slot.status !== 'open' || slot.booked + delta > slot.capacity) throw slotFull()

  let done = false
  try {
    await api.increment(col, slotId, 'booked', delta, slot.capacity)
    done = true
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
    // Plafond dépassé par une réservation simultanée ? Sinon : incrément atomique indisponible.
    const fresh = await api.getDoc(col, slotId)
    if (fresh.status !== 'open' || fresh.booked + delta > fresh.capacity) throw slotFull()
  }

  if (!done) {
    const fresh = await api.getDoc(col, slotId)
    if (fresh.booked + delta > fresh.capacity) throw slotFull()
    await api.updateDoc(col, slotId, { booked: fresh.booked + delta })
  }

  const after = await api.getDoc(col, slotId)
  if (after.booked >= after.capacity && after.status === 'open') {
    await api.updateDoc(col, slotId, { status: 'full' })
  }
}

/** Libère `delta` places (annulation, refus). Ne bloque jamais l'opération principale. */
export async function releaseSlot(api, slotId, delta, logError = console.error) {
  try {
    const slot = await api.getDoc(COL.availabilities, slotId)
    const booked = Math.max(0, slot.booked - delta)
    const status = slot.status === 'full' && booked < slot.capacity ? 'open' : slot.status
    await api.updateDoc(COL.availabilities, slotId, { booked, status })
  } catch (e) {
    logError(`[releaseSlot] ${slotId} : ${e?.message || e}`)
  }
}

/* ============================================================
   Notifications dans l'application + e-mails
============================================================ */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
export { esc }

/** Envoie un e-mail via Resend. Sans RESEND_API_KEY : ignoré (pas d'erreur). */
export async function sendEmail({ to, subject, html }, logError = console.error) {
  const apiKey = env.RESEND_API_KEY
  const from = env.MAIL_FROM
  if (!apiKey || !from || !to) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })
    if (!res.ok) {
      logError(`[email] Resend ${res.status} : ${(await res.text()).slice(0, 300)}`)
      return false
    }
    return true
  } catch (e) {
    logError(`[email] ${e?.message || e}`)
    return false
  }
}

/** Gabarit d'e-mail aux couleurs du site. */
export function emailTemplate({ title, lines, buttonLabel, link }) {
  const url = link ? `${CONFIG.appUrl}${link}` : ''
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#faf8f4;font-family:Arial,Helvetica,sans-serif;color:#2b261f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#008751;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:bold">Vanessa Tourisme</td></tr>
<tr><td style="height:4px;background:#fcd116"></td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:20px">${esc(title)}</h1>
${lines.map((l) => `<p style="margin:0 0 10px;font-size:15px;line-height:1.5">${esc(l)}</p>`).join('')}
${url && buttonLabel ? `<p style="margin:20px 0 0"><a href="${esc(url)}" style="background:#008751;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">${esc(buttonLabel)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:14px 24px;background:#f3efe6;font-size:12px;color:#665a49">Vanessa, celle qui connaît le Bénin mieux que vous · ASILLIA, Cotonou</td></tr>
</table></td></tr></table></body></html>`
}

/**
 * Crée une notification dans l'application, une seule fois par (réservation, utilisateur, type).
 * Renvoie true si elle vient d'être créée (donc si l'e-mail doit partir), false si elle existait.
 */
export async function createNotification(api, { userId, type, title, body, link, bookingId }) {
  const id = stableId('notif', bookingId || title, userId, type)
  try {
    await api.createDoc(
      COL.notifications,
      { userId, type, title, body: body ?? null, link: link ?? null, bookingId: bookingId ?? null, isRead: false },
      {
        id,
        permissions: [P.read(R.user(userId)), P.update(R.user(userId)), P.delete(R.user(userId))],
      },
    )
    return true
  } catch (e) {
    if (isConflict(e)) return false
    throw e
  }
}