// src/components/ui/Toast.tsx — Vanessa Tourisme
import { CircleAlert, CircleCheck, CircleX, Info, X } from 'lucide-react'

import { cn } from '@/lib/cn'
import { useUiStore, type ToastType } from '@/store/ui.store'

const styles: Record<ToastType, { box: string; icon: string }> = {
  success: { box: 'border-primary-200', icon: 'text-primary-600' },
  error: { box: 'border-danger-200', icon: 'text-danger-600' },
  warning: { box: 'border-accent-300', icon: 'text-accent-600' },
  info: { box: 'border-sable-200', icon: 'text-sky-600' },
}

const icons = {
  success: CircleCheck,
  error: CircleX,
  warning: CircleAlert,
  info: Info,
} as const

/** A placer une seule fois dans l'application (router/index.tsx). */
export function ToastViewport() {
  const toasts = useUiStore((s) => s.toasts)
  const dismissToast = useUiStore((s) => s.dismissToast)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:items-end"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        const style = styles[toast.type]
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border bg-white p-4 shadow-lift',
              style.box,
            )}
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.icon)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sable-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-sm text-sable-600">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Fermer la notification"
              className="rounded-full p-1 text-sable-400 hover:bg-sable-100 hover:text-sable-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}