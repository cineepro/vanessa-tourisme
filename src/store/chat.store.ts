import { create } from 'zustand'

import { COLLECTIONS } from '@/config/appwrite-ids'
import { CHAT_MAX_LENGTH } from '@/config/constants'
import { getErrorMessage } from '@/lib/appwrite'
import * as chatService from '@/services/chat.service'
import type {
  ChatMode,
  Conversation,
  Language,
  LatLng,
  Message,
  MessageFeedback,
} from '@/types'

/** Cle des messages d'une conversation pas encore creee cote serveur. */
export const NEW_CONVERSATION_KEY = '__new__'

interface SendOptions {
  userId: string
  location?: LatLng | null
  language?: Language
}

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  messagesByConversation: Record<string, Message[]>
  mode: ChatMode
  siteContextId: string | null
  remainingToday: number | null

  isLoadingConversations: boolean
  isLoadingMessages: boolean
  isSending: boolean
  error: string | null

  loadConversations: (userId: string) => Promise<void>
  selectConversation: (id: string | null) => Promise<void>
  startNewConversation: (options?: { mode?: ChatMode; siteContextId?: string | null }) => void
  setMode: (mode: ChatMode) => void
  setSiteContext: (siteId: string | null) => void
  sendMessage: (text: string, options: SendOptions) => Promise<boolean>
  rateMessage: (messageId: string, feedback: MessageFeedback) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
  archiveConversation: (id: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */
function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) =>
    (b.lastMessageAt ?? b.$createdAt).localeCompare(a.lastMessageAt ?? a.$createdAt),
  )
}

function upsertConversation(list: Conversation[], conversation: Conversation): Conversation[] {
  const without = list.filter((item) => item.$id !== conversation.$id)
  return sortConversations([conversation, ...without])
}

/** Message affiche tout de suite, avant la reponse du serveur. */
function makeTempMessage(userId: string, conversationId: string, content: string): Message {
  const now = new Date().toISOString()
  return {
    $id: `temp-${Date.now()}`,
    $createdAt: now,
    $updatedAt: now,
    $permissions: [],
    $collectionId: COLLECTIONS.messages,
    $databaseId: '',
    conversationId,
    userId,
    role: 'user',
    content,
    suggestedSiteIds: [],
    suggestedPlaceIds: [],
    metadata: null,
    lat: null,
    lng: null,
    tokensIn: null,
    tokensOut: null,
    latencyMs: null,
    feedback: 'none',
  }
}

const initialState = {
  conversations: [] as Conversation[],
  activeConversationId: null as string | null,
  messagesByConversation: {} as Record<string, Message[]>,
  mode: 'general' as ChatMode,
  siteContextId: null as string | null,
  remainingToday: null as number | null,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  error: null as string | null,
}

/* ------------------------------------------------------------
   Store
------------------------------------------------------------ */
export const useChatStore = create<ChatState>()((set, get) => ({
  ...initialState,

  loadConversations: async (userId) => {
    set({ isLoadingConversations: true, error: null })
    try {
      const conversations = await chatService.listConversations(userId)
      set({ conversations: sortConversations(conversations), isLoadingConversations: false })
    } catch (error) {
      set({ isLoadingConversations: false, error: getErrorMessage(error) })
    }
  },

  selectConversation: async (id) => {
    if (id === null) {
      get().startNewConversation()
      return
    }

    const conversation = get().conversations.find((item) => item.$id === id)
    set({
      activeConversationId: id,
      mode: conversation?.mode ?? get().mode,
      siteContextId: conversation?.siteContextId ?? null,
      error: null,
    })

    if (get().messagesByConversation[id]) return

    set({ isLoadingMessages: true })
    try {
      const messages = await chatService.listMessages(id)
      set((state) => ({
        messagesByConversation: { ...state.messagesByConversation, [id]: messages },
        isLoadingMessages: false,
      }))
    } catch (error) {
      set({ isLoadingMessages: false, error: getErrorMessage(error) })
    }
  },

  startNewConversation: (options = {}) =>
    set((state) => ({
      activeConversationId: null,
      messagesByConversation: { ...state.messagesByConversation, [NEW_CONVERSATION_KEY]: [] },
      mode: options.mode ?? state.mode,
      siteContextId: options.siteContextId ?? null,
      error: null,
    })),

  setMode: (mode) => set({ mode }),
  setSiteContext: (siteContextId) => set({ siteContextId }),

  sendMessage: async (text, { userId, location, language }) => {
    const message = text.trim()
    const state = get()
    if (!message || state.isSending) return false

    if (message.length > CHAT_MAX_LENGTH) {
      set({ error: `Votre message est trop long (${CHAT_MAX_LENGTH} caractères maximum).` })
      return false
    }

    const conversationId = state.activeConversationId
    const key = conversationId ?? NEW_CONVERSATION_KEY
    const temp = makeTempMessage(userId, conversationId ?? '', message)

    set((s) => ({
      isSending: true,
      error: null,
      messagesByConversation: {
        ...s.messagesByConversation,
        [key]: [...(s.messagesByConversation[key] ?? []), temp],
      },
    }))

    try {
      const result = await chatService.sendMessage({
        conversationId: conversationId ?? undefined,
        message,
        mode: state.mode,
        siteContextId: state.siteContextId ?? undefined,
        location: location ?? null,
        language,
      })

      const realKey = result.conversation.$id

      set((s) => {
        const previous = (s.messagesByConversation[key] ?? []).filter((m) => m.$id !== temp.$id)
        const messagesByConversation = { ...s.messagesByConversation }

        if (key === NEW_CONVERSATION_KEY) {
          messagesByConversation[NEW_CONVERSATION_KEY] = []
        }
        messagesByConversation[realKey] = [
          ...(key === NEW_CONVERSATION_KEY ? [] : previous),
          result.userMessage,
          result.assistantMessage,
        ]

        return {
          messagesByConversation,
          activeConversationId: realKey,
          conversations: upsertConversation(s.conversations, result.conversation),
          remainingToday: result.remainingToday ?? s.remainingToday,
          isSending: false,
        }
      })
      return true
    } catch (error) {
      set((s) => ({
        isSending: false,
        error: getErrorMessage(error),
        messagesByConversation: {
          ...s.messagesByConversation,
          [key]: (s.messagesByConversation[key] ?? []).filter((m) => m.$id !== temp.$id),
        },
      }))
      return false
    }
  },

  rateMessage: async (messageId, feedback) => {
    const key = get().activeConversationId
    if (!key) return

    const update = (value: MessageFeedback) =>
      set((s) => ({
        messagesByConversation: {
          ...s.messagesByConversation,
          [key]: (s.messagesByConversation[key] ?? []).map((m) =>
            m.$id === messageId ? { ...m, feedback: value } : m,
          ),
        },
      }))

    const previous =
      get().messagesByConversation[key]?.find((m) => m.$id === messageId)?.feedback ?? 'none'

    update(feedback)
    try {
      await chatService.sendFeedback(messageId, feedback)
    } catch (error) {
      update(previous)
      set({ error: getErrorMessage(error) })
    }
  },

  renameConversation: async (id, title) => {
    try {
      const updated = await chatService.renameConversation(id, title)
      set((s) => ({ conversations: upsertConversation(s.conversations, updated) }))
    } catch (error) {
      set({ error: getErrorMessage(error) })
    }
  },

  archiveConversation: async (id) => {
    try {
      await chatService.archiveConversation(id)
      set((s) => ({
        conversations: s.conversations.filter((c) => c.$id !== id),
        activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
      }))
    } catch (error) {
      set({ error: getErrorMessage(error) })
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ ...initialState }),
}))

/** Messages de la conversation affichee. */
export const selectActiveMessages = (state: ChatState): Message[] =>
  state.messagesByConversation[state.activeConversationId ?? NEW_CONVERSATION_KEY] ?? []