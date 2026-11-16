// src/pages/public/SiteDetailPage.tsx — Vanessa Tourisme
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Accessibility,
  Baby,
  ChevronRight,
  Clock,
  Gauge,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Share2,
  Sun,
  Ticket,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { ArticleCard } from '@/components/articles/ArticleCard'
import { GuideCard } from '@/components/guides/GuideCard'
import { PriceTable } from '@/components/guides/PriceTable'
import { ReviewList } from '@/components/reviews/ReviewList'
import { BestMonths } from '@/components/sites/BestMonths'
import { SiteGallery } from '@/components/sites/SiteGallery'
import { SiteGrid } from '@/components/sites/SiteGrid'
import { SiteMap } from '@/components/sites/SiteMap'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClasses } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Rating } from '@/components/ui/Rating'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import {
  CLIMATE_LABELS,
  DIFFICULTY_LABELS,
  ENVIRONMENT_LABELS,
  ROUTES,
  SITE_BUDGET_LABELS,
  SITE_CATEGORY_LABELS,
  VIBE_LABELS,
} from '@/config/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSiteArticles } from '@/hooks/useArticles'
import { useFavorites } from '@/hooks/useFavorites'
import { useSiteGuides } from '@/hooks/useGuides'
import { useSiteOffers } from '@/hooks/useOffers'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useRelatedSites, useSite } from '@/hooks/useSites'
import { cn } from '@/lib/cn'
import { formatDuration, formatPrice } from '@/lib/format'
import { directionsUrl } from '@/lib/geo'
import { getMinPrice } from '@/services/offers.service'
import { toast } from '@/store/ui.store'

export default function SiteDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const requireAuth = useRequireAuth()

  const { data: site, isLoading, error } = useSite(slug)
  useDocumentTitle(site?.name)

  const { data: offers } = useSiteOffers(site?.$id)
  const { data: guides } = useSiteGuides(site?.$id)
  const { data: articles } = useSiteArticles(site?.$id, 3)
  const { data: related } = useRelatedSites(site, 3)
  const { isFavorite, toggle } = useFavorites('site')

  if (isLoading && !site) {
    return (
      <div className="container-page space-y-6 py-8" aria-hidden="true">
        <Skeleton className="aspect-[16/7] w-full rounded-3xl" />
        <Skeleton className="h-10 w-1/2" />
        <SkeletonText lines={4} />
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Site introuvable"
          description={error ?? 'Ce site n’existe pas ou n’est plus disponible.'}
          action={
            <Link to={ROUTES.sites} className={buttonClasses({ variant: 'outline' })}>
              Voir tous les sites
            </Link>
          }
        />
      </div>
    )
  }

  const favorite = isFavorite(site.$id)
  const minPrice = offers ? getMinPrice(offers) : null

  const askVanessa = () => {
    const target = `${ROUTES.chat}?mode=advisor&site=${site.$id}`
    requireAuth({ redirectTo: target, onSuccess: () => navigate(target) })
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: site.name, text: site.summary, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Lien copié')
      }
    } catch {
      /* partage annulé par l'utilisateur */
    }
  }

  const facts: { icon: LucideIcon; label: string; value: ReactNode }[] = [
    { icon: Clock, label: 'Durée de visite', value: site.avgVisitMinutes ? formatDuration(site.avgVisitMinutes) : '—' },
    { icon: Gauge, label: 'Difficulté', value: DIFFICULTY_LABELS[site.difficulty] },
    {
      icon: Ticket,
      label: 'Entrée',
      value: site.entranceFee > 0 ? formatPrice(site.entranceFee) : 'Libre',
    },
    ...(site.budgetLevel
      ? [{ icon: Wallet, label: 'Budget', value: SITE_BUDGET_LABELS[site.budgetLevel] }]
      : []),
    ...(site.climateFeel
      ? [{ icon: Sun, label: 'Sensation', value: CLIMATE_LABELS[site.climateFeel] }]
      : []),
    ...(site.familyFriendly ? [{ icon: Baby, label: 'Famille', value: 'Adapté aux enfants' }] : []),
    ...(site.accessibleMobility
      ? [{ icon: Accessibility, label: 'Accessibilité', value: 'Accessible' }]
      : []),
  ]

  return (
    <div className="container-page py-6 sm:py-10">
      <nav aria-label="Fil d’Ariane" className="mb-4 flex items-center gap-1 text-sm text-sable-500">
        <Link to={ROUTES.sites} className="hover:text-primary-700">
          Sites
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="truncate text-sable-800">{site.name}</span>
      </nav>

      <SiteGallery site={site} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          {/* En-tête */}
          <header className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {site.categories.map((category) => (
                <Badge key={category} tone="primary">
                  {SITE_CATEGORY_LABELS[category]}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold text-sable-900 sm:text-5xl">{site.name}</h1>
            {site.tagline && <p className="text-lg text-sable-600">{site.tagline}</p>}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-sable-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {site.city}, {site.department}
              </span>
              {site.ratingCount > 0 && <Rating value={site.ratingAvg} count={site.ratingCount} />}
            </div>
          </header>

          {/* Repères */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map((fact) => {
              const Icon = fact.icon
              return (
                <div key={fact.label} className="rounded-2xl border border-sable-200 bg-white p-4">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sable-500">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {fact.label}
                  </dt>
                  <dd className="mt-1 font-display text-lg font-bold text-sable-900">{fact.value}</dd>
                </div>
              )
            })}
          </dl>

          {/* Présentation */}
          <section aria-labelledby="about-title" className="space-y-4">
            <h2 id="about-title" className="text-2xl font-bold text-sable-900">
              À découvrir
            </h2>
            <p className="whitespace-pre-line text-lg leading-relaxed text-sable-700">{site.description}</p>

            {site.highlights.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {site.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-sable-700">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-400" aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>
            )}

            {(site.vibes.length > 0 || site.environments.length > 0 || site.activities.length > 0) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {site.vibes.map((vibe) => (
                  <Badge key={vibe} tone="accent">
                    {VIBE_LABELS[vibe]}
                  </Badge>
                ))}
                {site.environments.map((environment) => (
                  <Badge key={environment} tone="info">
                    {ENVIRONMENT_LABELS[environment]}
                  </Badge>
                ))}
                {site.activities.map((activity) => (
                  <Badge key={activity} tone="neutral">
                    {activity}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          {site.history && (
            <section aria-labelledby="history-title" className="space-y-3">
              <h2 id="history-title" className="text-2xl font-bold text-sable-900">
                Un peu d’histoire
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-sable-700">{site.history}</p>
            </section>
          )}

          {/* Quand y aller */}
          <section aria-labelledby="when-title" className="space-y-3">
            <h2 id="when-title" className="text-2xl font-bold text-sable-900">
              Quand y aller ?
            </h2>
            <BestMonths months={site.bestMonths} note={site.bestSeasonNote} />
          </section>

          {(site.practicalInfo || site.openingHours) && (
            <section aria-labelledby="practical-title" className="space-y-3">
              <h2 id="practical-title" className="text-2xl font-bold text-sable-900">
                Infos pratiques
              </h2>
              {site.openingHours && (
                <p className="text-sable-700">
                  <span className="font-semibold">Horaires :</span> {site.openingHours}
                </p>
              )}
              {site.practicalInfo && (
                <p className="whitespace-pre-line text-sable-700">{site.practicalInfo}</p>
              )}
            </section>
          )}

          {/* Carte */}
          <section aria-labelledby="map-title" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="map-title" className="text-2xl font-bold text-sable-900">
                Où se trouve le site ?
              </h2>
              <a
                href={directionsUrl({ lat: site.latitude, lng: site.longitude })}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Itinéraire
              </a>
            </div>
            <SiteMap
              markers={[
                {
                  id: site.$id,
                  lat: site.latitude,
                  lng: site.longitude,
                  title: site.name,
                  subtitle: site.address ?? `${site.city}, ${site.department}`,
                },
              ]}
              center={{ lat: site.latitude, lng: site.longitude }}
              zoom={12}
              height={320}
            />
          </section>

          {/* Prestations */}
          <section id="reserver" aria-labelledby="offers-title" className="scroll-mt-24 space-y-4">
            <h2 id="offers-title" className="text-2xl font-bold text-sable-900">
              Réserver une visite guidée
            </h2>
            <PriceTable offers={offers ?? []} />
          </section>

          {guides && guides.length > 0 && (
            <section aria-labelledby="guides-title" className="space-y-4">
              <h2 id="guides-title" className="text-2xl font-bold text-sable-900">
                Les guides de ce site
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {guides.map((guide) => (
                  <GuideCard key={guide.$id} guide={guide} />
                ))}
              </div>
            </section>
          )}

          {/* Avis */}
          <section aria-labelledby="reviews-title" className="space-y-4">
            <h2 id="reviews-title" className="text-2xl font-bold text-sable-900">
              Avis des voyageurs
            </h2>
            <ReviewList siteId={site.$id} />
          </section>

          {articles && articles.length > 0 && (
            <section aria-labelledby="articles-title" className="space-y-4">
              <h2 id="articles-title" className="text-2xl font-bold text-sable-900">
                Pour aller plus loin
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.$id} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Colonne latérale */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-3xl border border-sable-200 bg-white p-5 shadow-card">
            <div>
              <p className="text-sm text-sable-500">Visite guidée</p>
              <p className="font-display text-3xl font-extrabold text-sable-900">
                {minPrice !== null ? (
                  <>
                    <span className="text-base font-medium text-sable-500">à partir de </span>
                    {formatPrice(minPrice)}
                  </>
                ) : (
                  'Sur demande'
                )}
              </p>
            </div>

            <a href="#reserver" className={buttonClasses({ size: 'lg', fullWidth: true })}>
              Voir les prestations
            </a>

            <Button
              variant="accent"
              size="lg"
              fullWidth
              onClick={askVanessa}
              leftIcon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
            >
              Demander à Vanessa
            </Button>

            <div className="flex gap-2 border-t border-sable-100 pt-4">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => void toggle(site.$id)}
                aria-pressed={favorite}
                leftIcon={
                  <Heart
                    className={cn('h-4 w-4', favorite && 'fill-danger-600 text-danger-600')}
                    aria-hidden="true"
                  />
                }
              >
                {favorite ? 'Favori' : 'Enregistrer'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => void share()}
                leftIcon={<Share2 className="h-4 w-4" aria-hidden="true" />}
              >
                Partager
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {related && related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16 space-y-5">
          <h2 id="related-title" className="text-2xl font-bold text-sable-900">
            Vous aimerez aussi
          </h2>
          <SiteGrid sites={related} />
        </section>
      )}
    </div>
  )
}