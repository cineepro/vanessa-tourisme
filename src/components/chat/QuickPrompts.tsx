// src/components/chat/QuickPrompts.tsx — Vanessa Tourisme
import { cn } from '@/lib/cn'

interface QuickPromptsProps {
  prompts: string[]
  onSelect: (prompt: string) => void
  disabled?: boolean
  className?: string
}

/** Suggestions de questions à envoyer en un clic. */
export function QuickPrompts({ prompts, onSelect, disabled, className }: QuickPromptsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-primary-200 bg-white px-4 py-2 text-left text-sm font-medium text-primary-800 transition-colors hover:bg-primary-50 disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}