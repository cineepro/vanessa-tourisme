import {
  Account,
  AppwriteException,
  Client,
  Databases,
  ExecutionMethod,
  Functions,
  ID,
  OAuthProvider,
  Permission,
  Query,
  Role,
  Storage,
} from 'appwrite'

import { env } from '@/config/env'
import type { BaseDoc, FunctionResponse, ListResult } from '@/types'

/* ------------------------------------------------------------
   Client Appwrite (meme projet que Vanessa : comptes partages)
------------------------------------------------------------ */
export const client = new Client()
  .setEndpoint(env.appwriteEndpoint)
  .setProject(env.projectId)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const functions = new Functions(client)

export const DATABASE_ID = env.databaseId

export { ID, Query, Permission, Role, OAuthProvider, ExecutionMethod, AppwriteException }

/* ------------------------------------------------------------
   Erreurs
------------------------------------------------------------ */
export class AppError extends Error {
  code: string
  status?: number

  constructor(message: string, code = 'APP_ERROR', status?: number) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
  }
}

/** Transforme n'importe quelle erreur en message lisible pour le touriste. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message

  if (error instanceof AppwriteException) {
    switch (error.type) {
      case 'user_invalid_credentials':
        return 'Email ou mot de passe incorrect.'
      case 'user_already_exists':
        return 'Un compte existe déjà avec cet email.'
      case 'user_session_already_exists':
        return 'Vous êtes déjà connecté.'
      case 'password_recently_used':
      case 'password_personal_data':
        return 'Ce mot de passe n’est pas assez sûr. Choisissez-en un autre.'
      case 'user_blocked':
        return 'Ce compte est désactivé. Contactez le support.'
      case 'general_rate_limit_exceeded':
        return 'Trop de tentatives. Patientez un instant puis réessayez.'
    }

    switch (error.code) {
      case 401:
        return 'Votre session a expiré. Reconnectez-vous.'
      case 403:
        return 'Vous n’avez pas la permission d’effectuer cette action.'
      case 404:
        return 'Élément introuvable.'
      case 409:
        return 'Cet élément existe déjà.'
      case 429:
        return 'Trop de requêtes. Patientez un instant puis réessayez.'
      case 500:
      case 503:
        return 'Le service est momentanément indisponible. Réessayez dans un instant.'
      default:
        return error.message || 'Une erreur est survenue.'
    }
  }

  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return 'Connexion impossible. Vérifiez votre connexion internet.'
  }

  if (error instanceof Error && error.message) return error.message

  return 'Une erreur inattendue est survenue.'
}

/* ------------------------------------------------------------
   Documents
   Tous les appels a la base passent par ces helpers : si la
   signature du SDK change, seul ce fichier est a adapter.
------------------------------------------------------------ */
export async function listDocuments<T extends BaseDoc>(
  collectionId: string,
  queries: string[] = [],
): Promise<ListResult<T>> {
  const res = await databases.listDocuments({
    databaseId: DATABASE_ID,
    collectionId,
    queries,
  })
  return { total: res.total, documents: res.documents as unknown as T[] }
}

export async function getDocument<T extends BaseDoc>(
  collectionId: string,
  documentId: string,
  queries: string[] = [],
): Promise<T> {
  const doc = await databases.getDocument({
    databaseId: DATABASE_ID,
    collectionId,
    documentId,
    queries,
  })
  return doc as unknown as T
}

export async function createDocument<T extends BaseDoc>(
  collectionId: string,
  data: Record<string, unknown>,
  options: { documentId?: string; permissions?: string[] } = {},
): Promise<T> {
  const doc = await databases.createDocument({
    databaseId: DATABASE_ID,
    collectionId,
    documentId: options.documentId ?? ID.unique(),
    data,
    permissions: options.permissions,
  })
  return doc as unknown as T
}

export async function updateDocument<T extends BaseDoc>(
  collectionId: string,
  documentId: string,
  data: Record<string, unknown>,
  permissions?: string[],
): Promise<T> {
  const doc = await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId,
    documentId,
    data,
    permissions,
  })
  return doc as unknown as T
}

export async function deleteDocument(
  collectionId: string,
  documentId: string,
): Promise<void> {
  await databases.deleteDocument({
    databaseId: DATABASE_ID,
    collectionId,
    documentId,
  })
}

/* ------------------------------------------------------------
   Fichiers (URLs construites a la main : stables et sans appel SDK)
------------------------------------------------------------ */
interface PreviewOptions {
  width?: number
  height?: number
  quality?: number
}

/** URL d'une image redimensionnee (webp). Renvoie null si pas de fichier. */
export function filePreviewUrl(
  bucketId: string,
  fileId: string | null | undefined,
  { width, height, quality = 80 }: PreviewOptions = {},
): string | null {
  if (!fileId) return null
  const params = new URLSearchParams({
    project: env.projectId,
    output: 'webp',
    quality: String(quality),
  })
  if (width) params.set('width', String(width))
  if (height) params.set('height', String(height))
  return `${env.appwriteEndpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?${params}`
}

/** URL du fichier original. */
export function fileViewUrl(
  bucketId: string,
  fileId: string | null | undefined,
): string | null {
  if (!fileId) return null
  return `${env.appwriteEndpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${env.projectId}`
}

/* ------------------------------------------------------------
   Functions
   Convention de reponse de TOUTES nos functions :
     { ok: true,  data: ... }
     { ok: false, error: "message", code?: "CODE" }
------------------------------------------------------------ */
export async function executeFunction<TResult>(
  functionId: string,
  payload: unknown = {},
  options: { path?: string; method?: ExecutionMethod } = {},
): Promise<TResult> {
  const execution = await functions.createExecution({
    functionId,
    body: JSON.stringify(payload),
    async: false,
    xpath: options.path ?? '/',
    method: options.method ?? ExecutionMethod.POST,
    headers: { 'content-type': 'application/json' },
  })

  let parsed: FunctionResponse<TResult> | null = null
  try {
    parsed = JSON.parse(execution.responseBody) as FunctionResponse<TResult>
  } catch {
    parsed = null
  }

  if (!parsed) {
    throw new AppError(
      String(execution.status) === 'failed'
        ? 'Le service a rencontré une erreur. Réessayez dans un instant.'
        : 'Réponse invalide du serveur.',
      'BAD_RESPONSE',
      execution.responseStatusCode,
    )
  }

  if (!parsed.ok) {
    throw new AppError(
      parsed.error || 'Une erreur est survenue.',
      parsed.code || 'FUNCTION_ERROR',
      execution.responseStatusCode,
    )
  }

  return parsed.data as TResult
}