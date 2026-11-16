// src/components/auth/AuthCard.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Carte centrée utilisée par toutes les pages d'authentification. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="container-page flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-sable-200 bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold text-sable-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-sable-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-sable-600">{footer}</div>}
      </div>
    </div>
  )
}