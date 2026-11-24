// scripts/lib/rest.mjs — Vanessa Tourisme
// Petit client REST Appwrite pour les scripts (aucun SDK : indépendant des versions).
// Lit le fichier .env (voir package.json : node --env-file=.env ...).

export const ENDPOINT = (process.env.VITE_APPWRITE_ENDPOINT || '').replace(/\/$/, '')
export const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID || ''
export const DB = process.env.VITE_APPWRITE_DATABASE_ID || ''
const KEY = process.env.APPWRITE_API_KEY || ''

export function requireEnv() {
  const missing = []
  if (!ENDPOINT) missing.push('VITE_APPWRITE_ENDPOINT')
  if (!PROJECT) missing.push('VITE_APPWRITE_PROJECT_ID')
  if (!DB) missing.push('VITE_APPWRITE_DATABASE_ID')
  if (!KEY) missing.push('APPWRITE_API_KEY')
  if (missing.length > 0) {
    console.error(`\n✖ Variables manquantes dans .env : ${missing.join(', ')}\n`)
    process.exit(1)
  }
}

export class RestError extends Error {
  constructor(status, message, type) {
    super(message)
    this.status = status
    this.type = type
  }
}

export async function api(method, path, body) {
  const res = await fetch(`${ENDPOINT}${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-appwrite-project': PROJECT, 'x-appwrite-key': KEY },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) throw new RestError(res.status, data?.message || text || `HTTP ${res.status}`, data?.type)
  return data
}

/** GET qui renvoie null si la ressource n'existe pas (404). */
export async function getOrNull(path) {
  try {
    return await api('GET', path)
  } catch (e) {
    if (e instanceof RestError && e.status === 404) return null
    throw e
  }
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Valeur d'une variable, avec ID par défaut (même logique que le site et les functions). */
export const idFrom = (envName, fallback) => process.env[envName] || fallback