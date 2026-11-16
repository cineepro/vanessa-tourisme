// src/components/chat/ChatWindow.tsx — Vanessa Tourisme
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { CircleX, Plus, Send, X } from 'lucide-react'

import { Skeleton } from '@/components/ui/Skeleton'
import { CHAT_MAX_LENGTH, CHAT_MODE_LABELS, toOptions } from '@/config/constants'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/cn'
import type { ChatMode } from '@/types'
import { LocationConsent } from './LocationConsent'
import { MessageBubble } from './MessageBubble'
import { QuickPrompts } from './QuickPrompts'

interface ChatWindowProps {
  className?: string
  /** Mode à activer à l'ouverture (ex: "advisor" depuis l'accueil) */
  initialMode?: ChatMode
  /** Message envoyé automatiquement à l'ouverture (ex: envie saisie sur l'accueil) */
  initialPrompt?: string
}

const MODE_OPTIONS = toOptions(CHAT_MODE_LABELS)

export function ChatWindow({ className, initialMode, initialPrompt }: ChatWindowProps) {
  const chat = useChat()
  const { setMode, send, messages, isSending, isLoadingMessages } = chat

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (initialMode) setMode(initialMode)
  }, [initialMode, setMode])

  // Envoi automatique du message venu de l'accueil (une seule fois)
  useEffect(() => {
    if (!initialPrompt || startedRef.current) return
    startedRef.current = true
    void send(initialPrompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, isSending])

  const resizeTextarea = () => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 140)}px`
  }

  const submit = async (text: string) => {
    const message = text.trim()
    if (!message || isSending) return

    setInput('')
    requestAnimationFrame(resizeTextarea)

    const ok = await send(message)
    if (!ok) setInput(message) // on rend le texte à l'utilisateur pour qu'il puisse réessayer
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit(input)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submit(input)
    }
  }

  const isEmpty = messages.length === 0
  const nearLimit = input.length > CHAT_MAX_LENGTH * 0.85

  return (
    <section
      aria-label="Discussion avec Vanessa"
      className={cn('flex h-full min-h-0 flex-col bg-sable-50', className)}
    >
      {/* En-tête : modes et nouvelle discussion */}
      <div className="flex items-center gap-2 border-b border-sable-200 bg-white px-3 py-2.5 sm:px-4">
        <div
          className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="Sujet de la discussion"
        >
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={chat.mode === option.value}
              onClick={() => chat.setMode(option.value)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                chat.mode === option.value
                  ? 'bg-primary-600 text-white'
                  : 'text-sable-700 hover:bg-sable-100',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => chat.startNewConversation()}
          aria-label="Nouvelle discussion"
          title="Nouvelle discussion"
          className="shrink-0 rounded-full p-2 text-sable-600 hover:bg-sable-100"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6" aria-live="polite">
        <div className="mx-auto max-w-3xl space-y-5">
          {isLoadingMessages && isEmpty ? (
            <div className="space-y-4" aria-hidden="true">
              <Skeleton className="h-16 w-2/3 rounded-3xl" />
              <Skeleton className="ml-auto h-12 w-1/2 rounded-3xl" />
              <Skeleton className="h-20 w-3/4 rounded-3xl" />
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center px-2 py-8 text-center">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 font-display text-3xl font-extrabold text-white"
                aria-hidden="true"
              >
                V
              </span>
              <h2 className="mt-4 text-2xl font-bold text-sable-900">Salut, moi c’est Vanessa !</h2>
              <p className="mt-2 max-w-md text-sable-600">
                Dis-moi ce que tu veux vivre au Bénin, je te propose le site qui te correspond, et je reste
                avec toi pendant tout ton séjour.
              </p>
              <QuickPrompts
                className="mt-6 justify-center"
                prompts={chat.quickPrompts}
                disabled={isSending}
                onSelect={(prompt) => void submit(prompt)}
              />
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.$id} message={message} onRate={chat.rateMessage} />
            ))
          )}

          {isSending && (
            <div className="flex items-end gap-2.5" role="status">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-sm font-extrabold text-white"
                aria-hidden="true"
              >
                V
              </span>
              <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-md border border-sable-200 bg-white px-4 py-3.5">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-2 w-2 animate-typing-dot rounded-full bg-sable-400"
                    style={{ animationDelay: `${dot * 0.15}s` }}
                  />
                ))}
                <span className="sr-only">Vanessa écrit…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Saisie */}
      <div className="border-t border-sable-200 bg-white px-3 py-3 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {chat.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
            >
              <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{chat.error}</span>
              <button type="button" onClick={chat.clearError} aria-label="Fermer le message d’erreur">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {chat.mode === 'companion' && !chat.canShareLocation && <LocationConsent />}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
                resizeTextarea()
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={CHAT_MAX_LENGTH}
              placeholder="Écrivez à Vanessa…"
              aria-label="Votre message"
              className="max-h-36 min-h-12 flex-1 resize-none rounded-3xl border border-sable-300 bg-white px-4 py-3 text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Envoyer"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-40"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>

          <div className="flex justify-between px-2 text-xs text-sable-400">
            <span>
              {chat.remainingToday !== null
                ? `${chat.remainingToday} message${chat.remainingToday > 1 ? 's' : ''} restant${chat.remainingToday > 1 ? 's' : ''} aujourd’hui`
                : 'Entrée pour envoyer, Maj + Entrée pour un retour à la ligne'}
            </span>
            {nearLimit && (
              <span className={input.length >= CHAT_MAX_LENGTH ? 'text-danger-600' : ''}>
                {input.length} / {CHAT_MAX_LENGTH}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}