// src/components/layout/Logo.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'

import { ROUTES, APP_NAME } from '@/config/constants'
import { cn } from '@/lib/cn'

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link
      to={ROUTES.home}
      aria-label={`${APP_NAME} - accueil`}
      className={cn('inline-flex items-center gap-2.5', className)}
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 font-display text-lg font-extrabold text-white">
        V
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-accent-400" />
      </span>
      <span
        className={cn(
          'font-display text-lg font-bold leading-none tracking-tight',
          light ? 'text-white' : 'text-sable-900',
        )}
      >
        Vanessa <span className={light ? 'text-accent-300' : 'text-primary-700'}>Tourisme</span>
      </span>
    </Link>
  )
}