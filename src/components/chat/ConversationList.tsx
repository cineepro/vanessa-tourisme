// src/components/chat/ConversationList.tsx — Vanessa Tourisme
import { Archive, MessageSquare, Plus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { CHAT_MODE_LABELS } from '@/config/constants'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/format'
import type { Conversation } from '@/types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  isLoading?: boolean
  onSelect: (id: string) => void
  onNew: () => void
  onArchive?: (id: string) => void
  className?: string
}

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNew,
  onArchive,
  className,
}: ConversationListProps) {
  return (
    <nav aria-label="Vos discussions" className={cn('flex h-full flex-col gap-3', className)}>
      <Button
        onClick={onNew}
        fullWidth
        leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
      >
        Nouvelle discussion
      </Button>

      <div className="flex-1 space-y-1 overflow-y-auto">
        {isLoading && conversations.length === 0 ? (
          [0, 1, 2].map((index) => <Skeleton key={index} className="h-16 w-full rounded-2xl" />)
        ) : conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-sable-500">
            Vos discussions avec Vanessa apparaîtront ici.
          </p>
        ) : (
          conversations.map((conversation) => {
            const active = conversation.$id === activeId
            return (
              <div
                key={conversation.$id}
                className={cn(
                  'group flex items-start gap-1 rounded-2xl transition-colors',
                  active ? 'bg-primary-50' : 'hover:bg-sable-100',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.$id)}
                  aria-current={active ? 'true' : undefined}
                  className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3 text-left"
                >
                  <MessageSquare
                    className={cn('mt-0.5 h-4 w-4 shrink-0', active ? 'text-primary-600' : 'text-sable-400')}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-sable-900">
                      {conversation.title || 'Nouvelle discussion'}
                    </span>
                    <span className="block truncate text-xs text-sable-500">
                      {conversation.lastMessagePreview || CHAT_MODE_LABELS[conversation.mode]}
                    </span>
                    <span className="block text-[11px] text-sable-400">
                      {formatRelative(conversation.lastMessageAt ?? conversation.$createdAt)}
                    </span>
                  </span>
                </button>

                {onArchive && (
                  <button
                    type="button"
                    onClick={() => onArchive(conversation.$id)}
                    aria-label={`Archiver la discussion ${conversation.title ?? ''}`}
                    className="mr-1 mt-2 rounded-full p-2 text-sable-400 opacity-100 hover:bg-sable-200 hover:text-sable-700 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                  >
                    <Archive className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </nav>
  )
}