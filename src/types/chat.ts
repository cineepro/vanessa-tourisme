import type { BaseDoc, Language, LatLng } from './index'

export type ChatMode = 'general' | 'advisor' | 'culture' | 'companion'
export type ChatRole = 'user' | 'assistant' | 'system'
export type MessageFeedback = 'none' | 'up' | 'down'

/** Collection `tour_conversations` */
export interface Conversation extends BaseDoc {
  userId: string
  title: string | null
  mode: ChatMode
  siteContextId: string | null
  bookingContextId: string | null
  vanessaConversationId: string | null
  language: Language
  lastMessageAt: string | null
  lastMessagePreview: string | null
  messageCount: number
  isArchived: boolean
}

/** Collection `tour_messages` */
export interface Message extends BaseDoc {
  conversationId: string
  userId: string
  role: ChatRole
  content: string
  /** Sites recommandes : affiches en cartes sous la reponse */
  suggestedSiteIds: string[]
  suggestedPlaceIds: string[]
  /** JSON libre serialise */
  metadata: string | null
  lat: number | null
  lng: number | null
  tokensIn: number | null
  tokensOut: number | null
  latencyMs: number | null
  feedback: MessageFeedback
}

/** Envoye a la Function `tour-chat` */
export interface SendMessageInput {
  conversationId?: string
  message: string
  mode?: ChatMode
  siteContextId?: string
  bookingContextId?: string
  /** Fournie uniquement si le touriste a consenti au partage de position */
  location?: LatLng | null
  language?: Language
}

export interface SendMessageResult {
  conversation: Conversation
  userMessage: Message
  assistantMessage: Message
  /** Messages restants aujourd'hui (quota journalier) */
  remainingToday?: number
}