import { useEffect } from 'react'

import { APP_NAME } from '@/config/constants'

/** Titre de l'onglet : "Ouidah | Vanessa Tourisme" */
export function useDocumentTitle(title?: string | null): void {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} | ${APP_NAME}` : previous
    return () => {
      document.title = previous
    }
  }, [title])
}