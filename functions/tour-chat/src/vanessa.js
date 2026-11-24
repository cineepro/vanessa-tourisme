// functions/tour-chat/src/vanessa.js — Vanessa Tourisme
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ADAPTATEUR vers l'IA Vanessa (vanessa-api).                             ║
// ║  C'EST LE SEUL FICHIER À ADAPTER si le contrat de votre API est          ║
// ║  différent : adresse, authentification, forme de la requête et de la     ║
// ║  réponse. Le reste de la function n'en dépend pas.                       ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// Variables d'environnement :
//   VANESSA_API_URL          adresse complète de l'API (obligatoire)
//   VANESSA_API_KEY          clé d'accès (facultatif si l'API est ouverte)
//   VANESSA_API_KEY_HEADER   en-tête portant la clé (défaut : Authorization)
//   VANESSA_API_KEY_PREFIX   préfixe de la valeur (défaut : "Bearer "). Mettre vide pour un en-tête type x-api-key.
//   VANESSA_API_MODEL        nom du modèle, si votre API en demande un (facultatif)
//   VANESSA_TIMEOUT_MS       délai maximum d'attente (défaut : 45000)
import { HttpError } from './utils.js'

/**
 * Corps envoyé à l'API. Il contient à la fois une forme « simple » (message / system / history)
 * et une forme « messages » (style chat), pour être accepté par la plupart des API.
 */
export function buildRequestBody({ system, history, message, user, mode }) {
  const model = process.env.VANESSA_API_MODEL
  return {
    ...(model ? { model } : {}),
    source: 'vanessa-tourisme',
    mode,
    user: { id: user.id, name: user.name },
    system,
    message,
    history,
    messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }],
  }
}

/** Extrait le texte de la réponse, quelle que soit la forme usuelle. */
export function extractReply(data) {
  if (typeof data === 'string') return data
  if (!data || typeof data !== 'object') return ''

  const candidates = [
    data.reply,
    data.response,
    data.answer,
    data.message?.content,
    typeof data.message === 'string' ? data.message : undefined,
    data.text,
    data.output,
    data.content,
    data.data?.reply,
    data.data?.response,
    data.data?.message,
    data.data?.text,
    data.choices?.[0]?.message?.content,
    data.choices?.[0]?.text,
  ]
  const found = candidates.find((value) => typeof value === 'string' && value.trim() !== '')
  return found ? found.trim() : ''
}

function extractUsage(data) {
  const usage = data?.usage || data?.data?.usage || {}
  const tokensIn = usage.prompt_tokens ?? usage.input_tokens ?? usage.tokensIn
  const tokensOut = usage.completion_tokens ?? usage.output_tokens ?? usage.tokensOut
  return {
    tokensIn: Number.isInteger(tokensIn) ? tokensIn : null,
    tokensOut: Number.isInteger(tokensOut) ? tokensOut : null,
  }
}

/** Appelle Vanessa. Renvoie { reply, tokensIn, tokensOut, conversationId? }. */
export async function askVanessa({ system, history, message, user, mode }) {
  const url = process.env.VANESSA_API_URL
  if (!url) {
    throw new HttpError(503, 'VANESSA_UNAVAILABLE', 'Vanessa n’est pas disponible pour le moment. Réessayez bientôt.')
  }

  const headers = { 'content-type': 'application/json', accept: 'application/json' }
  const key = process.env.VANESSA_API_KEY
  if (key) {
    const name = process.env.VANESSA_API_KEY_HEADER || 'Authorization'
    const prefix = process.env.VANESSA_API_KEY_PREFIX ?? 'Bearer '
    headers[name] = `${prefix}${key}`
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Number(process.env.VANESSA_TIMEOUT_MS) || 45_000)

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(buildRequestBody({ system, history, message, user, mode })),
      signal: controller.signal,
    })
  } catch (e) {
    const timedOut = e?.name === 'AbortError'
    throw new HttpError(
      504,
      timedOut ? 'VANESSA_TIMEOUT' : 'VANESSA_UNREACHABLE',
      timedOut
        ? 'Vanessa met trop de temps à répondre. Réessayez dans un instant.'
        : 'Vanessa est injoignable pour le moment. Réessayez dans un instant.',
    )
  } finally {
    clearTimeout(timer)
  }

  const text = await response.text()
  if (!response.ok) {
    console.error(`[vanessa] HTTP ${response.status} : ${text.slice(0, 300)}`)
    throw new HttpError(502, 'VANESSA_ERROR', 'Vanessa a rencontré un problème. Réessayez dans un instant.')
  }

  let data = text
  try {
    data = JSON.parse(text)
  } catch {
    /* réponse en texte brut : acceptée telle quelle */
  }

  const reply = extractReply(data)
  if (!reply) {
    console.error(`[vanessa] réponse sans texte exploitable : ${text.slice(0, 300)}`)
    throw new HttpError(502, 'VANESSA_EMPTY', 'Vanessa n’a pas pu répondre. Reformulez votre question.')
  }

  return {
    reply: reply.slice(0, 9000),
    ...extractUsage(data),
    conversationId: typeof data?.conversationId === 'string' ? data.conversationId.slice(0, 64) : null,
  }
}