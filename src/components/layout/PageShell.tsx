// src/components/layout/PageShell.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

import { cn } from '@/lib/cn'
import { Footer } from './Footer'
import { MobileTabBar } from './MobileTabBar'
import { Navbar } from './Navbar'

interface PageShellProps {
  /** Contenu direct, ou rien pour afficher la route enfant (<Outlet />) */
  children?: ReactNode
  className?: string
  hideFooter?: boolean
  hideTabBar?: boolean
}

/** Structure commune : barre de navigation, contenu, pied de page, barre du bas mobile. */
export function PageShell({ children, className, hideFooter, hideTabBar }: PageShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift"
      >
        Aller au contenu
      </a>

      <Navbar />

      <main id="contenu" className={cn('flex-1', !hideTabBar && 'pb-20 md:pb-0', className)}>
        {children ?? <Outlet />}
      </main>

      {!hideFooter && <Footer />}
      {!hideTabBar && <MobileTabBar />}
    </div>
  )
}