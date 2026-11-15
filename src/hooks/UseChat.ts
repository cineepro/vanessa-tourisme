import { useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { CHAT_QUICK_PROMPTS } from '@/config/constants'
import { getCurrentPosition } from '@/lib/geo'
import { useAuthStore } from '@/store/auth.store'
import { selectActiveMessages, useChatStore } from '@/store/chat.store'
import type { LatLng } from '@/types'
import { useRequireAuth } from './useRequireAuth'

/**
 * Discussion avec Vanessa : conversations, messages et envoi.
 * La position n'est transmise qu'en mode "compagnon" ET si le touriste
 * a active le partage dans son profil.
 */
export function useChat() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const requireAuth = useRequireAuth()

  const messages = useChatStore(selectActiveMessages)
  const state = useChatStore(
    useShallow((s) => ({
      conversations: s.conversations,
      activeConversationId: s.activeConversationId,
      mode: s.mode,
      siteContextId: s.siteContextId,
      remainingToday: s.remainingToday,
      isLoadingConversations: s.isLoadingConversations,
      isLoadingMessages: s.isLoadingMessages,
      isSending: s.isSending,
      error: s.error,
    })),
  )
  const actions = useChatStore(
    useShallow((s) => ({
      loadConversations: s.loadConversations,
      selectConversation: s.selectConversation,
      startNewConversation: s.startNewConversation,
      setMode: s.setMode,
      setSiteContext: s.setSiteContext,
      rateMessage: s.rateMessage,
      renameConversation: s.renameConversation,
      archiveConversation: s.archiveConversation,
      clearError: s.clearError,
      sendMessage: s.sendMessage,
    })),
  )

  const userId = user?.id
  const { loadConversations } = actions

  useEffect(() => {
    if (userId) void loadConversations(userId)
  }, [userId, loadConversations])

  const send = useCallback(
    async (text: string): Promise<boolean> => {
      if (!requireAuth() || !userId) return false

      let location: LatLng | null = null
      if (state.mode === 'companion' && profile?.shareLocation) {
        try {
          const position = await getCurrentPosition()
          location = { lat: position.lat, lng: position.lng }
        } catch {
          /* sans position, Vanessa repond quand meme (sans lieux proches) */
        }
      }

      return actions.sendMessage(text, {
        userId,
        location,
        language: profile?.preferredLanguage,
      })
    },
    [actions, profile?.preferredLanguage, profile?.shareLocation, requireAuth, state.mode, userId],
  )

  return {
    ...state,
    messages,
    quickPrompts: CHAT_QUICK_PROMPTS[state.mode],
    send,
    selectConversation: actions.selectConversation,
    startNewConversation: actions.startNewConversation,
    setMode: actions.setMode,
    setSiteContext: actions.setSiteContext,
    rateMessage: actions.rateMessage,
    renameConversation: actions.renameConversation,
    archiveConversation: actions.archiveConversation,
    clearError: actions.clearError,
    canShareLocation: Boolean(profile?.shareLocation),
  }
}