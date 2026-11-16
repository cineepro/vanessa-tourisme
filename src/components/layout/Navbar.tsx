// src/components/layout/Navbar.tsx — Vanessa Tourisme
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarCheck,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  User,
  X,
} from 'lucide-react'

import { Button, buttonClasses } from '@/components/ui/Button'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { useUiStore } from '@/store/ui.store'
import { Logo } from './Logo'

const NAV_LINKS = [
  { to: ROUTES.sites, label: 'Sites' },
  { to: ROUTES.guides, label: 'Guides' },
  { to: ROUTES.discover, label: 'Découvrir' },
  { to: ROUTES.practical, label: 'Infos pratiques' },
] as const

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-primary-50 text-primary-800' : 'text-sable-700 hover:bg-sable-100',
  )

export function Navbar() {
  const { user, isAuthenticated, isChecking, isAgencyStaff, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const requireAuth = useRequireAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const openAuthModal = useUiStore((s) => s.openAuthModal)
  const mobileMenuOpen = useUiStore((s) => s.mobileMenuOpen)
  const setMobileMenuOpen = useUiStore((s) => s.setMobileMenuOpen)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Ferme les menus à chaque changement de page
  useEffect(() => {
    setMenuOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname, setMobileMenuOpen])

  // Ferme le menu utilisateur au clic à l'extérieur
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const goToChat = () =>
    requireAuth({ redirectTo: ROUTES.chat, onSuccess: () => navigate(ROUTES.chat) })

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate(ROUTES.home)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sable-200 bg-sable-50/90 backdrop-blur safe-top">
      <div className="flag-stripe h-1" />
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="accent"
            size="sm"
            onClick={goToChat}
            leftIcon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
            className="hidden sm:inline-flex"
          >
            Parler à Vanessa
          </Button>

          {isChecking ? (
            <div className="skeleton h-9 w-24 rounded-full" aria-hidden="true" />
          ) : isAuthenticated && user ? (
            <>
              <Link
                to={ROUTES.notifications}
                aria-label={
                  unreadCount > 0 ? `Notifications (${unreadCount} non lues)` : 'Notifications'
                }
                className="relative rounded-full p-2 text-sable-700 hover:bg-sable-100"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div ref={menuRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 rounded-full border border-sable-200 bg-white py-1 pl-1 pr-2.5 hover:bg-sable-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                    {initials(user.name)}
                  </span>
                  <ChevronDown className="h-4 w-4 text-sable-500" aria-hidden="true" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 animate-fade-in overflow-hidden rounded-2xl border border-sable-200 bg-white py-1 shadow-lift"
                  >
                    <div className="border-b border-sable-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-sable-900">{user.name}</p>
                      <p className="truncate text-xs text-sable-500">{user.email}</p>
                    </div>
                    <MenuLink to={ROUTES.profile} icon={<User className="h-4 w-4" />} label="Mon profil" />
                    <MenuLink to={ROUTES.bookings} icon={<CalendarCheck className="h-4 w-4" />} label="Mes réservations" />
                    <MenuLink to={ROUTES.favorites} icon={<Heart className="h-4 w-4" />} label="Mes favoris" />
                    {isAgencyStaff && (
                      <MenuLink to={ROUTES.agency} icon={<LayoutDashboard className="h-4 w-4" />} label="Espace agence" />
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 border-t border-sable-100 px-4 py-2.5 text-sm text-danger-700 hover:bg-danger-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" onClick={() => openAuthModal('login')}>
                Connexion
              </Button>
              <Button variant="outline" size="sm" onClick={() => openAuthModal('signup')}>
                Créer un compte
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            className="rounded-full p-2 text-sable-700 hover:bg-sable-100 md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Menu mobile"
          className="animate-fade-in border-t border-sable-200 bg-sable-50 md:hidden"
        >
          <div className="container-page flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-sable-200 pt-3">
              <Button variant="accent" onClick={goToChat} fullWidth leftIcon={<MessageCircle className="h-4 w-4" />}>
                Parler à Vanessa
              </Button>

              {isAuthenticated ? (
                <>
                  <Link to={ROUTES.favorites} className={buttonClasses({ variant: 'outline', fullWidth: true })}>
                    Mes favoris
                  </Link>
                  {isAgencyStaff && (
                    <Link to={ROUTES.agency} className={buttonClasses({ variant: 'outline', fullWidth: true })}>
                      Espace agence
                    </Link>
                  )}
                  <Button variant="ghost" onClick={handleLogout} fullWidth>
                    Se déconnecter
                  </Button>
                </>
              ) : (
                !isChecking && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => openAuthModal('login')}>
                      Connexion
                    </Button>
                    <Button variant="primary" onClick={() => openAuthModal('signup')}>
                      Inscription
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}

function MenuLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-sable-800 hover:bg-sable-100"
    >
      <span className="text-sable-500" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Link>
  )
}