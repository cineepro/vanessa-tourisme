// src/pages/agency/AgencyContext.tsx — Vanessa Tourisme
import { createContext, useContext } from 'react'

import type { Agency, AgencyRole } from '@/types'

export interface AgencyContextValue {
  /** Agence actuellement gérée */
  agency: Agency
  /** Toutes les agences accessibles (plusieurs pour un superadmin) */
  agencies: Agency[]
  role: AgencyRole | 'superadmin'
  /** Propriétaire, admin ou superadmin : paramètres, suppressions */
  canManage: boolean
  /** Peut modifier le contenu (sites, guides, offres) */
  canEdit: boolean
  selectAgency: (agencyId: string) => void
  /** Recharge les informations de l'agence (après modification des paramètres) */
  refresh: () => void
}

export const AgencyContext = createContext<AgencyContextValue | null>(null)

export function useAgency(): AgencyContextValue {
  const value = useContext(AgencyContext)
  if (!value) throw new Error('useAgency doit être utilisé à l’intérieur de AgencyLayout.')
  return value
}