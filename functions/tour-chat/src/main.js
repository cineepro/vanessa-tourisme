// functions/tour-chat/src/main.js — Vanessa Tourisme
//
// Discussion avec Vanessa. Trois routes (le site appelle la même function avec un chemin différent) :
//   POST /          { conversationId?, message, mode?, siteContextId?, bookingContextId?, location?, language? }
//                   -> { conversation, userMessage, assistantMessage, remainingToday }
//   POST /quota     {}                                  -> { limit, used, remaining }
//   POST /feedback  { messageId, feedback: "up"|"down"|"none" }
//
// Le navigateur n'a jamais la clé de vanessa-api : tout passe ici. Cette function :
//   1. vérifie l'utilisateur et son quota journalier ;
//   2. prépare le contexte tourisme (sites, offres, lieux proches, articles) ;
//   3. appelle Vanessa (voir vanessa.js) ;
//   4. enregistre la conversation et les messages (seulement si Vanessa a répondu).
import {
  COL,
  HttpError,
  P,
  Q,
  R,
  assertConfig,
  cleanText,
  createApi,
  fail,
  handleError,
  isConflict,
  isId,
  isNotFound,
  ok,
  readBody,
  requireUser,
  stableId,
  todayKey,
} from './utils.js'
import { askVanessa } from './vanessa.js'
import {
  buildSystemPrompt,
  loadArticles,
  loadNearbyPlaces,
  loadOffersForSite,
  loadSites,
  norm,
  pickSites,
} from './context.js'

const MODES = ['general', 'advisor', 'culture', 'companion']
const MAX_MESSAGE = 1000
const HISTORY_LIMIT = 12

const dailyLimit = () => Math.max(1, Number(process.env.CHAT_DAILY_LIMIT) || 50)
const bad = (message) => new HttpError(400, 'INVALID_INPUT', message)

/* ============================================================
   Validation
============================================================ */
export function parseChatInput(body) {
  if (typeof body.message !== 'string' || body.message.trim() === '') throw bad('Écrivez un message.')
  if (body.message.trim().length > MAX_MESSAGE) throw bad(`Message trop long (${MAX_MESSAGE} caractères maximum).`)

  if (body.conversationId !== undefined && body.conversationId !== null && !isId(body.conversationId)) {
    throw bad('Discussion invalide.')
  }
  if (body.siteContextId !== undefined && body.siteContextId !== null && !isId(body.siteContextId)) {
    throw bad('Site invalide.')
  }

  let location = null
  const loc = body.location
  if (loc && typeof loc === 'object') {
    const lat = Number(loc.lat)
    const lng = Number(loc.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      location = { lat, lng }
    }
  }

  return {
    message: cleanText(body.message, MAX_MESSAGE),
    conversationId: body.conversationId || null,
    siteContextId: body.siteContextId || null,
    mode: MODES.includes(body.mode) ? body.mode : 'general',
    language: body.language === 'en' ? 'en' : 'fr',
    location,
  }
}

/* ============================================================
   Quota journalier (ID déterministe : aucun index nécessaire)
============================================================ */
async function getUsage(api, userId, dayKey) {
  const id = stableId('usage', userId, dayKey)
  try {
    const doc = await api.getDoc(COL.chatUsage, id)
    return { id, exists: true, count: doc.count || 0, tokens: doc.tokens || 0 }
  } catch (e) {
    if (isNotFound(e)) return { id, exists: false, count: 0, tokens: 0 }
    throw e
  }
}

async function saveUsage(api, usage, userId, dayKey, addTokens) {
  const next = { count: usage.count + 1, tokens: usage.tokens + addTokens }
  if (usage.exists) return api.updateDoc(COL.chatUsage, usage.id, next)
  try {
    return await api.createDoc(COL.chatUsage, { userId, dayKey, ...next }, { id: usage.id, permissions: [] })
  } catch (e) {
    if (!isConflict(e)) throw e
    // Deux messages simultanés : on relit puis on incrémente
    const fresh = await getUsage(api, userId, dayKey)
    return api.updateDoc(COL.chatUsage, usage.id, { count: fresh.count + 1, tokens: fresh.tokens + addTokens })
  }
}

/* ============================================================
   Routes
============================================================ */
async function quotaRoute({ api, user }) {
  const limit = dailyLimit()
  const usage = await getUsage(api, user.$id, todayKey())
  return { limit, used: usage.count, remaining: Math.max(0, limit - usage.count) }
}

async function feedbackRoute({ api, user, body }) {
  if (!isId(body.messageId)) throw bad('Message invalide.')
  if (!['up', 'down', 'none'].includes(body.feedback)) throw bad('Avis invalide.')

  let message
  try {
    message = await api.getDoc(COL.messages, body.messageId)
  } catch (e) {
    if (isNotFound(e)) throw new HttpError(404, 'NOT_FOUND', 'Message introuvable.')
    throw e
  }
  if (message.userId !== user.$id) throw new HttpError(403, 'FORBIDDEN', 'Ce message n’est pas dans vos discussions.')
  if (message.role !== 'assistant') throw bad('Seules les réponses de Vanessa peuvent être notées.')

  await api.updateDoc(COL.messages, message.$id, { feedback: body.feedback })
  return {}
}

const getOrNull = async (api, col, id) => {
  try {
    return await api.getDoc(col, id)
  } catch (e) {
    if (isNotFound(e)) return null
    throw e
  }
}

async function sendRoute({ api, user, body, error }) {
  const input = parseChatInput(body)
  const dayKey = todayKey()
  const limit = dailyLimit()

  /* 1. Quota */
  const usage = await getUsage(api, user.$id, dayKey)
  if (usage.count >= limit) {
    throw new HttpError(
      429,
      'QUOTA_EXCEEDED',
      `Vous avez atteint la limite de ${limit} messages pour aujourd’hui. Vanessa vous retrouve demain !`,
    )
  }

  /* 2. Discussion existante */
  let conversation = null
  let history = []
  if (input.conversationId) {
    conversation = await getOrNull(api, COL.conversations, input.conversationId)
    if (!conversation) throw new HttpError(404, 'NOT_FOUND', 'Discussion introuvable.')
    if (conversation.userId !== user.$id) throw new HttpError(403, 'FORBIDDEN', 'Cette discussion n’est pas la vôtre.')
    if (conversation.isArchived) throw new HttpError(409, 'ARCHIVED', 'Cette discussion est archivée.')

    const recent = await api.listDocs(COL.messages, [
      Q.equal('conversationId', conversation.$id),
      Q.orderDesc('$createdAt'),
      Q.limit(HISTORY_LIMIT),
    ])
    history = recent.documents
      .reverse()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
  }

  /* 3. Contexte tourisme */
  const profile = await getOrNull(api, COL.profiles, user.$id)

  // Défense en profondeur : la position n'est utilisée que si le touriste a activé le partage
  const location = input.location && profile?.shareLocation === true ? input.location : null

  const mode = input.mode
  const siteContextId = input.siteContextId || conversation?.siteContextId || null

  let siteContext = null
  if (siteContextId) {
    const site = await getOrNull(api, COL.sites, siteContextId)
    if (site && site.status === 'published') {
      siteContext = { site, offers: await loadOffersForSite(api, site.$id) }
    }
  }

  const catalog = mode === 'culture' || mode === 'companion' ? [] : await loadSites(api)
  const sites = pickSites(catalog, input.message, profile, siteContext ? 3 : 4).filter((s) => s.$id !== siteContext?.site.$id)

  const places = location ? await loadNearbyPlaces(api, location, input.message) : []
  const articles = mode === 'culture' || mode === 'general' ? await loadArticles(api, input.message) : []

  const system = buildSystemPrompt({ mode, language: input.language, user: { name: user.name }, profile, siteContext, sites, places, articles, location })

  /* 4. Vanessa */
  const startedAt = Date.now()
  const answer = await askVanessa({
    system,
    history,
    message: input.message,
    user: { id: user.$id, name: user.name },
    mode,
  })
  const latencyMs = Date.now() - startedAt

  /* 5. Enregistrement (seulement maintenant : rien n'est gardé si Vanessa a échoué) */
  const replyNorm = norm(answer.reply)
  const mentioned = (list) => list.filter((item) => replyNorm.includes(norm(item.name))).map((item) => item.$id).slice(0, 3)
  const suggestedSiteIds = mentioned([...(siteContext ? [siteContext.site] : []), ...sites])
  const suggestedPlaceIds = mentioned(places)

  const nowIso = new Date().toISOString()
  const ownerPerms = [P.read(R.user(user.$id)), P.update(R.user(user.$id)), P.delete(R.user(user.$id))]
  const preview = answer.reply.replace(/\s+/g, ' ').slice(0, 200)

  if (!conversation) {
    conversation = await api.createDoc(
      COL.conversations,
      {
        userId: user.$id,
        title: input.message.replace(/\s+/g, ' ').slice(0, 60),
        mode,
        siteContextId,
        bookingContextId: null,
        vanessaConversationId: answer.conversationId,
        language: input.language,
        lastMessageAt: nowIso,
        lastMessagePreview: preview,
        messageCount: 2,
        isArchived: false,
      },
      { permissions: ownerPerms },
    )
  } else {
    conversation = await api.updateDoc(COL.conversations, conversation.$id, {
      mode,
      lastMessageAt: nowIso,
      lastMessagePreview: preview,
      messageCount: (conversation.messageCount || 0) + 2,
      ...(answer.conversationId && !conversation.vanessaConversationId ? { vanessaConversationId: answer.conversationId } : {}),
    })
  }

  const readOnly = [P.read(R.user(user.$id))]

  const userMessage = await api.createDoc(
    COL.messages,
    {
      conversationId: conversation.$id,
      userId: user.$id,
      role: 'user',
      content: input.message,
      suggestedSiteIds: [],
      suggestedPlaceIds: [],
      metadata: null,
      lat: location ? location.lat : null,
      lng: location ? location.lng : null,
      tokensIn: null,
      tokensOut: null,
      latencyMs: null,
      feedback: 'none',
    },
    { permissions: readOnly },
  )

  const assistantMessage = await api.createDoc(
    COL.messages,
    {
      conversationId: conversation.$id,
      userId: user.$id,
      role: 'assistant',
      content: answer.reply,
      suggestedSiteIds,
      suggestedPlaceIds,
      metadata: JSON.stringify({ mode, siteContextId, sitesInContext: sites.map((s) => s.$id) }).slice(0, 4900),
      lat: null,
      lng: null,
      tokensIn: answer.tokensIn,
      tokensOut: answer.tokensOut,
      latencyMs,
      feedback: 'none',
    },
    { permissions: readOnly },
  )

  /* 6. Quota consommé */
  try {
    await saveUsage(api, usage, user.$id, dayKey, (answer.tokensIn || 0) + (answer.tokensOut || 0))
  } catch (e) {
    error(`[tour-chat] quota non enregistré : ${e?.message || e}`)
  }

  return {
    conversation,
    userMessage,
    assistantMessage,
    remainingToday: Math.max(0, limit - usage.count - 1),
  }
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

    if (path === '/quota') return ok(res, await quotaRoute({ api, user }))
    if (path === '/feedback') return ok(res, await feedbackRoute({ api, user, body }))
    if (path === '/') return ok(res, await sendRoute({ api, user, body, error }), 201)

    return fail(res, 404, 'NOT_FOUND', 'Route inconnue.')
  } catch (err) {
    return handleError(res, err, error)
  }
}