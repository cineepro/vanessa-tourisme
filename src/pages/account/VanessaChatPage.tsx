// src/pages/account/VanessaChatPage.tsx — Vanessa Tourisme
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessagesSquare, X } from 'lucide-react'

import { ChatWindow } from '@/components/chat/ChatWindow'
import { ConversationList } from '@/components/chat/ConversationList'
import { PageLoader } from '@/components/ui/Spinner'
import { CHAT_MAX_LENGTH } from '@/config/constants'
import { useChat } from '@/hooks/useChat'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useUiStore } from '@/store/ui.store'
import type { ChatMode } from '@/types'

const MODES: ChatMode[] = ['general', 'advisor', 'culture', 'companion']

/**
 * Chat plein écran avec Vanessa.
 * Paramètres d'URL reconnus (envoyés par l'accueil, les fiches site, les articles) :
 *   ?mode=advisor|culture|companion|general   sujet de la discussion
 *   ?q=...                                    message envoyé automatiquement
 *   ?site=<id>                                site dont on parle
 */
export default function VanessaChatPage() {
  useDocumentTitle('Discuter avec Vanessa')

  const [params, setParams] = useSearchParams()
  const chat = useChat()
  const sidebarOpen = useUiStore((s) => s.chatSidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setChatSidebarOpen)

  // L'intention de départ est lue une seule fois, puis retirée de l'adresse
  const [intent] = useState(() => {
    const mode = params.get('mode')
    return {
      mode: MODES.find((item) => item === mode),
      prompt: params.get('q')?.trim().slice(0, CHAT_MAX_LENGTH) || undefined,
      site: params.get('site') || undefined,
    }
  })
  const hasIntent = Boolean(intent.mode || intent.prompt || intent.site)
  const [ready, setReady] = useState(!hasIntent)

  const { startNewConversation } = chat

  useEffect(() => {
    if (!hasIntent) return
    // Une intention précise démarre toujours une nouvelle discussion
    startNewConversation({ mode: intent.mode, siteContextId: intent.site ?? null })
    setParams({}, { replace: true })
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return <PageLoader />

  const list = (
    <ConversationList
      conversations={chat.conversations}
      activeId={chat.activeConversationId}
      isLoading={chat.isLoadingConversations}
      onSelect={(id) => {
        void chat.selectConversation(id)
        setSidebarOpen(false)
      }}
      onNew={() => {
        chat.startNewConversation()
        setSidebarOpen(false)
      }}
      onArchive={(id) => void chat.archiveConversation(id)}
    />
  )

  return (
    <div className="flex h-[calc(100dvh-4.25rem)] min-h-0">
      {/* Liste des discussions : colonne fixe sur grand écran */}
      <aside className="hidden w-72 shrink-0 border-r border-sable-200 bg-white p-3 md:block">{list}</aside>

      {/* Sur téléphone : tiroir */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Vos discussions">
          <div className="absolute inset-0 bg-sable-900/60" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] animate-fade-in flex-col bg-white p-3 shadow-lift">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer"
              className="mb-2 self-end rounded-full p-2 text-sable-500 hover:bg-sable-100"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-h-0 flex-1">{list}</div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b border-sable-200 bg-white px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-sable-700 hover:bg-sable-100"
          >
            <MessagesSquare className="h-4 w-4" aria-hidden="true" />
            Mes discussions
          </button>
        </div>

        <ChatWindow className="flex-1" initialMode={intent.mode} initialPrompt={intent.prompt} />
      </div>
    </div>
  )
}