// src/components/ui/Modal.tsx — Vanessa Tourisme
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlay?: boolean
}

const sizes = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl' } as const

/** Fenêtre modale : feuille du bas sur téléphone, boîte centrée sur grand écran. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-sable-900/60"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-fade-up flex-col overflow-hidden bg-white shadow-lift outline-none',
          'rounded-t-3xl sm:rounded-3xl',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5 sm:px-6">
          <div>
            {title && (
              <h2 id={titleId} className="text-xl font-bold text-sable-900">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-sable-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-2 -mt-1 rounded-full p-2 text-sable-500 hover:bg-sable-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>

        {footer && <div className="border-t border-sable-200 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}