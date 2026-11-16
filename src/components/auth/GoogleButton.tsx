// src/components/auth/GoogleButton.tsx — Vanessa Tourisme
import { useState } from 'react'

import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'
import { GoogleIcon } from './GoogleIcon'

interface GoogleButtonProps {
  label?: string
  /** Page à ouvrir après la connexion (chemin interne) */
  next?: string
  className?: string
}

export function GoogleButton({ label = 'Continuer avec Google', next = '/', className }: GoogleButtonProps) {
  const { loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    // Redirection de page complète : le chargement reste affiché jusqu'au départ
    setLoading(true)
    loginWithGoogle(next)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-sable-300 bg-white py-3',
        'font-display text-base font-semibold text-sable-900 transition-colors hover:bg-sable-100 disabled:opacity-60',
        className,
      )}
    >
      <GoogleIcon />
      {loading ? 'Redirection...' : label}
    </button>
  )
}