// src/components/layout/Footer.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'

import { ROUTES, SLOGAN } from '@/config/constants'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="mt-16 bg-sable-900 text-sable-200">
      <div className="flag-stripe h-1" />
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm text-sable-300">{SLOGAN}.</p>
          <p className="mt-2 max-w-sm text-sm text-sable-400">
            Découvrez, réservez et vivez le Bénin avec une assistante qui connaît le pays de
            l’intérieur.
          </p>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
            Explorer
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <FooterLink to={ROUTES.sites}>Sites touristiques</FooterLink>
            <FooterLink to={ROUTES.guides}>Guides</FooterLink>
            <FooterLink to={ROUTES.discover}>Culture et histoire</FooterLink>
            <FooterLink to={ROUTES.practical}>Infos pratiques</FooterLink>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
            Mon espace
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <FooterLink to={ROUTES.chat}>Parler à Vanessa</FooterLink>
            <FooterLink to={ROUTES.bookings}>Mes réservations</FooterLink>
            <FooterLink to={ROUTES.favorites}>Mes favoris</FooterLink>
            <FooterLink to={ROUTES.about}>À propos</FooterLink>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-sable-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ASILLIA · Cotonou, Bénin</p>
          <div className="flex gap-4">
            <Link to={ROUTES.terms} className="hover:text-white">
              Conditions d’utilisation
            </Link>
            <Link to={ROUTES.privacy} className="hover:text-white">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sable-300 transition-colors hover:text-accent-300">
        {children}
      </Link>
    </li>
  )
}