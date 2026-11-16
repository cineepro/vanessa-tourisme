// src/components/layout/LegalPage.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'

import { useDocumentTitle } from '@/hooks/useDocumentTitle'

interface LegalPageProps {
  title: string
  updatedAt: string
  intro?: string
  children: ReactNode
}

/** Mise en page des textes juridiques. */
export function LegalPage({ title, updatedAt, intro, children }: LegalPageProps) {
  useDocumentTitle(title)

  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <h1 className="text-3xl font-bold text-sable-900 sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-sable-500">Dernière mise à jour : {updatedAt}</p>
      {intro && <p className="mt-6 text-sable-700">{intro}</p>}
      <div className="mt-8 space-y-8 text-sable-700">{children}</div>
    </article>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-sable-900">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed">{children}</div>
    </section>
  )
}