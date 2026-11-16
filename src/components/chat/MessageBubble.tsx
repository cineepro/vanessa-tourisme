// src/components/chat/MessageBubble.tsx — Vanessa Tourisme
import { Fragment, type ReactNode } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'

import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/format'
import type { Message, MessageFeedback } from '@/types'
import { SuggestedPlaces, SuggestedSites } from './SuggestedSites'

interface MessageBubbleProps {
  message: Message
  onRate?: (messageId: string, feedback: MessageFeedback) => void
}

/** Gras **texte** uniquement : rien n'est injecté en HTML. */
function renderInline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.length > 4 && part.startsWith('**') && part.endsWith('**') ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      ),
    )
}

const BULLET = /^\s*[-•*]\s+/

function RichText({ content }: { content: string }) {
  const blocks = content.trim().split(/\n{2,}/)

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        const lines = block.split('\n')
        if (lines.every((line) => BULLET.test(line))) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.replace(BULLET, ''))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={index} className="whitespace-pre-line">
            {renderInline(block)}
          </p>
        )
      })}
    </div>
  )
}

export function MessageBubble({ message, onRate }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isPending = message.$id.startsWith('temp-')

  return (
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <span
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-sm font-extrabold text-white"
          aria-hidden="true"
        >
          V
        </span>
      )}

      <div className={cn('max-w-[85%] space-y-2 sm:max-w-[75%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-3xl px-4 py-3 text-[15px] leading-relaxed',
            isUser
              ? 'rounded-br-md bg-primary-600 text-white'
              : 'rounded-bl-md border border-sable-200 bg-white text-sable-900 shadow-sm',
            isPending && 'opacity-70',
          )}
        >
          <RichText content={message.content} />
        </div>

        {!isUser && message.suggestedSiteIds.length > 0 && (
          <SuggestedSites ids={message.suggestedSiteIds} />
        )}
        {!isUser && message.suggestedPlaceIds.length > 0 && (
          <SuggestedPlaces ids={message.suggestedPlaceIds} />
        )}

        <div
          className={cn(
            'flex items-center gap-2 px-1 text-xs text-sable-400',
            isUser && 'justify-end',
          )}
        >
          {!isPending && <time dateTime={message.$createdAt}>{formatTime(message.$createdAt)}</time>}

          {!isUser && onRate && !isPending && (
            <span className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onRate(message.$id, message.feedback === 'up' ? 'none' : 'up')}
                aria-pressed={message.feedback === 'up'}
                aria-label="Réponse utile"
                className={cn(
                  'rounded-full p-1.5 hover:bg-sable-100',
                  message.feedback === 'up' && 'text-primary-600',
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onRate(message.$id, message.feedback === 'down' ? 'none' : 'down')}
                aria-pressed={message.feedback === 'down'}
                aria-label="Réponse inutile"
                className={cn(
                  'rounded-full p-1.5 hover:bg-sable-100',
                  message.feedback === 'down' && 'text-danger-600',
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}