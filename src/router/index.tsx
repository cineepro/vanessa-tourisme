// src/router/index.tsx — Vanessa Tourisme
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AuthModal } from '@/components/auth/AuthModal'
import { PageShell } from '@/components/layout/PageShell'
import { ToastViewport } from '@/components/ui/Toast'
import { PageLoader } from '@/components/ui/Spinner'
import { useAuthStore } from '@/store/auth.store'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'

/* ------------------------------------------------------------
   Pages (chargées à la demande). Fichiers à créer dans src/pages/.
------------------------------------------------------------ */
// Publiques
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const SitesPage = lazy(() => import('@/pages/public/SitesPage'))
const SiteDetailPage = lazy(() => import('@/pages/public/SiteDetailPage'))
const GuidesPage = lazy(() => import('@/pages/public/GuidesPage'))
const GuideDetailPage = lazy(() => import('@/pages/public/GuideDetailPage'))
const DiscoverPage = lazy(() => import('@/pages/public/DiscoverPage'))
const ArticleDetailPage = lazy(() => import('@/pages/public/ArticleDetailPage'))
const PracticalInfoPage = lazy(() => import('@/pages/public/PracticalInfoPage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const TermsPage = lazy(() => import('@/pages/public/TermsPage'))
const PrivacyPage = lazy(() => import('@/pages/public/PrivacyPage'))
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'))

// Authentification
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))
const EmailConfirmedPage = lazy(() => import('@/pages/auth/EmailConfirmedPage'))
const OAuthCallbackPage = lazy(() => import('@/pages/auth/OAuthCallbackPage'))

// Espace voyageur
const VanessaChatPage = lazy(() => import('@/pages/account/VanessaChatPage'))
const BookPage = lazy(() => import('@/pages/account/BookPage'))
const MyBookingsPage = lazy(() => import('@/pages/account/MyBookingsPage'))
const BookingDetailPage = lazy(() => import('@/pages/account/BookingDetailPage'))
const FavoritesPage = lazy(() => import('@/pages/account/FavoritesPage'))
const ProfilePage = lazy(() => import('@/pages/account/ProfilePage'))
const NotificationsPage = lazy(() => import('@/pages/account/NotificationsPage'))

// Espace agence
const AgencyLayout = lazy(() => import('@/pages/agency/AgencyLayout'))
const AgencyDashboardPage = lazy(() => import('@/pages/agency/DashboardPage'))
const AgencySitesPage = lazy(() => import('@/pages/agency/SitesAdminPage'))
const AgencyGuidesPage = lazy(() => import('@/pages/agency/GuidesAdminPage'))
const AgencyOffersPage = lazy(() => import('@/pages/agency/OffersAdminPage'))
const AgencyBookingsPage = lazy(() => import('@/pages/agency/BookingsAdminPage'))
const AgencyReviewsPage = lazy(() => import('@/pages/agency/ReviewsAdminPage'))
const AgencySettingsPage = lazy(() => import('@/pages/agency/SettingsPage'))

/* ------------------------------------------------------------
   Utilitaires
------------------------------------------------------------ */
/** Vérifie la session une seule fois au démarrage. */
function AuthBootstrap() {
  useEffect(() => {
    void useAuthStore.getState().init()
  }, [])
  return null
}

/** Remonte en haut de page à chaque changement de route. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/* ------------------------------------------------------------
   Routes
------------------------------------------------------------ */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Navigation libre : pas besoin de compte */}
          <Route element={<PageShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/sites" element={<SitesPage />} />
            <Route path="/sites/:slug" element={<SiteDetailPage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/guides/:slug" element={<GuideDetailPage />} />
            <Route path="/decouvrir" element={<DiscoverPage />} />
            <Route path="/decouvrir/:slug" element={<ArticleDetailPage />} />
            <Route path="/infos-pratiques" element={<PracticalInfoPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Authentification (mêmes chemins que Vanessa) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/email-confirmed" element={<EmailConfirmedPage />} />
            <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

            {/* Connexion requise */}
            <Route element={<ProtectedRoute />}>
              <Route path="/reserver/:offerId" element={<BookPage />} />
              <Route path="/mes-reservations" element={<MyBookingsPage />} />
              <Route path="/mes-reservations/:id" element={<BookingDetailPage />} />
              <Route path="/favoris" element={<FavoritesPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          {/* Chat : plein écran, sans pied de page */}
          <Route element={<PageShell hideFooter hideTabBar />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/vanessa" element={<VanessaChatPage />} />
            </Route>
          </Route>

          {/* Espace agence / super-admin */}
          <Route element={<PageShell hideFooter hideTabBar />}>
            <Route element={<RoleRoute />}>
              <Route path="/agence" element={<AgencyLayout />}>
                <Route index element={<AgencyDashboardPage />} />
                <Route path="sites" element={<AgencySitesPage />} />
                <Route path="guides" element={<AgencyGuidesPage />} />
                <Route path="offres" element={<AgencyOffersPage />} />
                <Route path="reservations" element={<AgencyBookingsPage />} />
                <Route path="avis" element={<AgencyReviewsPage />} />
                <Route path="parametres" element={<AgencySettingsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/accueil" element={<Navigate to="/" replace />} />
          <Route element={<PageShell />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>

      <AuthModal />
      <ToastViewport />
    </BrowserRouter>
  )
}