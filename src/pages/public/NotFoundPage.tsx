// src/pages/public/NotFoundPage.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

import { buttonClasses } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ROUTES } from '@/config/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page introuvable')

  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<Compass className="h-6 w-6" aria-hidden="true" />}
        title="Cette page est introuvable"
        description="Elle a peut-être été déplacée, ou l’adresse contient une erreur. Retournez à l’accueil ou parcourez les sites."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={ROUTES.home} className={buttonClasses({ variant: 'primary' })}>
              Accueil
            </Link>
            <Link to={ROUTES.sites} className={buttonClasses({ variant: 'outline' })}>
              Voir les sites
            </Link>
          </div>
        }
      />
    </div>
  )
}