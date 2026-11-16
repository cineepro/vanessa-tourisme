// src/components/guides/GuideCard.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { BadgeCheck, Briefcase, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { ROUTES, SPOKEN_LANGUAGE_LABELS } from '@/config/constants'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { guidePhotoUrl } from '@/services/storage.service'
import type { Guide } from '@/types'

export function GuideCard({ guide, className }: { guide: Guide; className?: string }) {
  const photo = guidePhotoUrl(guide)
  const languages = guide.languages.slice(0, 3).map((code) => SPOKEN_LANGUAGE_LABELS[code])

  return (
    <Link
      to={ROUTES.guide(guide.slug)}
      className={cn(
        'flex gap-4 rounded-3xl border border-sable-200 bg-white p-4 shadow-card transition-shadow hover:shadow-lift',
        className,
      )}
    >
      {photo ? (
        <img
          src={photo}
          alt={guide.fullName}
          loading="lazy"
          className="h-20 w-20 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary-100 font-display text-2xl font-bold text-primary-700">
          {initials(guide.fullName)}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-display text-lg font-bold text-sable-900">{guide.fullName}</h3>
          {guide.certified && (
            <Badge tone="primary" icon={<BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />}>
              Agréé
            </Badge>
          )}
        </div>

        {guide.baseCity && (
          <p className="flex items-center gap-1 text-sm text-sable-500">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {guide.baseCity}
          </p>
        )}

        {guide.ratingCount > 0 ? (
          <Rating value={guide.ratingAvg} count={guide.ratingCount} size="sm" />
        ) : (
          <span className="text-xs text-sable-400">Pas encore d’avis</span>
        )}

        <p className="text-sm text-sable-600">
          {languages.join(', ')}
          {guide.languages.length > 3 ? '…' : ''}
        </p>

        {guide.yearsExperience ? (
          <p className="flex items-center gap-1 text-xs text-sable-500">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            {guide.yearsExperience} an{guide.yearsExperience > 1 ? 's' : ''} d’expérience
          </p>
        ) : null}
      </div>
    </Link>
  )
}