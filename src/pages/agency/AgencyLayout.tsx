// src/pages/agency/AgencyLayout.tsx — Vanessa Tourisme
import { useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2,
  CalendarCheck,
  Compass,
  LayoutDashboard,
  MessageSquareQuote,
  Settings,
  Tag,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { EmptyState } from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/Spinner'
import { ROUTES } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { getAgenciesByIds, listAgencies } from '@/services/admin.service'
import { AgencyContext, type AgencyContextValue } from './AgencyContext'

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: ROUTES.agency, label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: `${ROUTES.agency}/reservations`, label: 'Réservations', icon: CalendarCheck },
  { to: `${ROUTES.agency}/sites`, label: 'Sites', icon: Compass },
  { to: `${ROUTES.agency}/guides`, label: 'Guides', icon: Users },
  { to: `${ROUTES.agency}/offres`, label: 'Offres et tarifs', icon: Tag },
  { to: `${ROUTES.agency}/avis`, label: 'Avis', icon: MessageSquareQuote },
  { to: `${ROUTES.agency}/parametres`, label: 'Paramètres', icon: Settings },
]

const STORAGE_KEY = 'vt-agency'

function readStoredAgency(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Cadre de l'espace agence : charge l'agence gérée et la partage via useAgency(). */
export default function AgencyLayout() {
  useDocumentTitle('Espace agence')

  const { role: userRole, memberships } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(readStoredAgency)

  const memberKey = memberships.map((m) => `${m.agencyId}:${m.role}`).join(',')
  const { data: agencies, isLoading, error, reload } = useAsync(
    () => (userRole === 'superadmin' ? listAgencies() : getAgenciesByIds(memberships.map((m) => m.agencyId))),
    [userRole, memberKey],
  )

  const agency = agencies?.find((item) => item.$id === selectedId) ?? agencies?.[0]

  const value = useMemo<AgencyContextValue | null>(() => {
    if (!agency || !agencies) return null

    const membership = memberships.find((m) => m.agencyId === agency.$id)
    const role = userRole === 'superadmin' ? 'superadmin' : (membership?.role ?? 'staff')
    const canManage = role === 'superadmin' || role === 'owner' || role === 'admin'

    return {
      agency,
      agencies,
      role,
      canManage,
      canEdit: canManage || role === 'staff',
      selectAgency: (agencyId) => {
        setSelectedId(agencyId)
        try {
          sessionStorage.setItem(STORAGE_KEY, agencyId)
        } catch {
          /* stockage indisponible */
        }
      },
      refresh: reload,
    }
  }, [agency, agencies, memberships, userRole, reload])

  if (isLoading && !agencies) return <PageLoader />

  if (error) {
    return (
      <div className="container-page py-16">
        <EmptyState title="Impossible de charger votre agence" description={error} />
      </div>
    )
  }

  if (!value) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
          title="Aucune agence associée à votre compte"
          description="Demandez à ASILLIA de vous ajouter à l’équipe de votre agence, puis reconnectez-vous."
        />
      </div>
    )
  }

  const inactive = value.agency.licenseStatus === 'suspended' || value.agency.licenseStatus === 'expired'

  return (
    <AgencyContext.Provider value={value}>
      <div className="container-page py-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">Espace agence</p>
            <h1 className="truncate text-2xl font-bold text-sable-900 sm:text-3xl">{value.agency.name}</h1>
          </div>

          {value.agencies.length > 1 && (
            <label className="text-sm font-medium text-sable-700">
              <span className="sr-only">Changer d’agence</span>
              <select
                value={value.agency.$id}
                onChange={(event) => value.selectAgency(event.target.value)}
                className="h-11 rounded-full border border-sable-300 bg-white px-4 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              >
                {value.agencies.map((item) => (
                  <option key={item.$id} value={item.$id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </header>

        {inactive && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-accent-300 bg-accent-50 p-4 text-sm text-accent-900"
          >
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" aria-hidden="true" />
            <p>
              La licence de cette agence est{' '}
              <strong>{value.agency.licenseStatus === 'suspended' ? 'suspendue' : 'expirée'}</strong>. Contactez
              ASILLIA pour la régulariser.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <nav aria-label="Espace agence" className="md:sticky md:top-24 md:self-start">
            <ul className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide md:flex-col md:overflow-visible md:pb-0">
              {NAV.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to} className="shrink-0">
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors md:rounded-2xl',
                          isActive ? 'bg-primary-600 text-white' : 'text-sable-700 hover:bg-sable-100',
                        )
                      }
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>

          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </AgencyContext.Provider>
  )
}