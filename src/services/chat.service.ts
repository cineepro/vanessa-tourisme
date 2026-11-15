import { COLLECTIONS, FUNCTIONS } from '@/config/appwrite-ids'
import {
  executeFunction,
  getDocument,
  listDocuments,
  Query,
  updateDocument,
} from '@/lib/appwrite'
import type {
  Conversation,
  Message,
  MessageFeedback,
  SendMessageInput,
  SendMessageResult,
} from '@/types'

/* ------------------------------------------------------------
   Envoi : tout passe par la Function `tour-chat`, qui appelle
   vanessa-api avec le contexte tourisme et enregistre les messages.
------------------------------------------------------------ */
export function sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
  return executeFunction<SendMessageResult>(FUNCTIONS.chat, input)
}

export interface ChatQuota {
  limit: number
  used: number
  remaining: number
}

/** Route `/quota` de la Function tour-chat. */
export function getChatQuota(): Promise<ChatQuota> {
  return executeFunction<ChatQuota>(FUNCTIONS.chat, {}, { path: '/quota' })
}

/** Route `/feedback` de la Function tour-chat (le client ne modifie jamais un message). */
export function sendFeedback(messageId: string, feedback: MessageFeedback): Promise<void> {
  return executeFunction<void>(FUNCTIONS.chat, { messageId, feedback }, { path: '/feedback' })
}

/* ------------------------------------------------------------
   Lecture
------------------------------------------------------------ */
export async function listConversations(
  userId: string,
  options: { includeArchived?: boolean; limit?: number } = {},
): Promise<Conversation[]> {
  const queries: string[] = [Query.equal('userId', userId)]
  if (!options.includeArchived) queries.push(Query.equal('isArchived', false))
  queries.push(Query.orderDesc('lastMessageAt'))
  queries.push(Query.limit(options.limit ?? 50))

  const { documents } = await listDocuments<Conversation>(COLLECTIONS.conversations, queries)
  return documents
}

export function getConversation(id: string): Promise<Conversation> {
  return getDocument<Conversation>(COLLECTIONS.conversations, id)
}

export async function listMessages(conversationId: string, limit = 200): Promise<Message[]> {
  const { documents } = await listDocuments<Message>(COLLECTIONS.messages, [
    Query.equal('conversationId', conversationId),
    Query.orderAsc('$createdAt'),
    Query.limit(limit),
  ])
  return documents
}

/* ------------------------------------------------------------
   Gestion des conversations (le proprietaire a les droits update)
------------------------------------------------------------ */
export function renameConversation(id: string, title: string): Promise<Conversation> {
  return updateDocument<Conversation>(COLLECTIONS.conversations, id, { title: title.trim() })
}

export function archiveConversation(id: string): Promise<Conversation> {
  return updateDocument<Conversation>(COLLECTIONS.conversations, id, { isArchived: true })
}