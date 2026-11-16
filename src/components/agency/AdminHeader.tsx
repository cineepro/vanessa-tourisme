// src/components/agency/AdminHeader.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'

interface AdminHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

/** En-tête commun des pages de l'espace agence. */
export function AdminHeader({ title, description, action }: AdminHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-sable-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-sable-600">{description}</p>}
      </div>
      {action}
    </header>
  )
}