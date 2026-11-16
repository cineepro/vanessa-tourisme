// src/components/layout/MobileTabBar.tsx — Vanessa Tourisme
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { CalendarCheck, Compass, House, MessageCircle, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { ROUTES } from '@/config/constants'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { cn } from '@/lib/cn'

interface Tab {
  to: string
  label: string
  icon: LucideIcon
  /** Page réservée aux comptes : ouvre la connexion si besoin */
  protected?: boolean
  highlight?: boolean
  end?: boolean
}

const TABS: Tab[] = [
  { to: ROUTES.home, label: 'Accueil', icon: House, end: true },
  { to: ROUTES.sites, label: 'Sites', icon: Compass },
  { to: ROUTES.chat, label: 'Vanessa', icon: MessageCircle, protected: true, highlight: true },
  { to: ROUTES.bookings, label: 'Réservations', icon: CalendarCheck, protected: true },
  { to: ROUTES.profile, label: 'Profil', icon: User, protected: true },
]

/** Barre de navigation du bas, visible uniquement sur téléphone. */
export function MobileTabBar() {
  const requireAuth = useRequireAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = (event: React.MouseEvent, tab: Tab) => {
    if (!tab.protected) return
    event.preventDefault()
    requireAuth({ redirectTo: tab.to, onSuccess: () => navigate(tab.to) })
  }

  return (
    <nav
      aria-label="Navigation du bas"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-sable-200 bg-white/95 backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = tab.end
            ? location.pathname === tab.to
            : location.pathname.startsWith(tab.to)

          return (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                onClick={(event) => handleClick(event, tab)}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                  active ? 'text-primary-700' : 'text-sable-500',
                )}
              >
                {tab.highlight ? (
                  <span
                    className={cn(
                      '-mt-5 flex h-12 w-12 items-center justify-center rounded-full shadow-lift',
                      active ? 'bg-primary-700 text-white' : 'bg-accent-400 text-sable-900',
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                ) : (
                  <Icon className="h-5 w-5" aria-hidden="true" />
                )}
                {tab.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}