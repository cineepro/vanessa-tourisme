// src/components/guides/GuideProfile.tsx — Vanessa Tourisme
import { BadgeCheck, Briefcase, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import { SPOKEN_LANGUAGE_LABELS } from '@/config/constants'
import { initials, telUrl, whatsappUrl } from '@/lib/format'
import { guidePhotoUrl } from '@/services/storage.service'
import type { Guide } from '@/types'

/** Présentation complète d'un guide (page guide). */
export function GuideProfile({ guide }: { guide: Guide }) {
  const photo = guidePhotoUrl(guide, { width: 480, height: 480 })

  return (
    <section className="rounded-3xl border border-sable-200 bg-white p-5 shadow-card sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        {photo ? (
          <img
            src={photo}
            alt={guide.fullName}
            className="h-40 w-40 shrink-0 rounded-3xl object-cover"
          />
        ) : (
          <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-3xl bg-primary-100 font-display text-5xl font-bold text-primary-700">
            {initials(guide.fullName)}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-sable-900">{guide.fullName}</h1>
            {guide.certified && (
              <Badge tone="primary" icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />}>
                Guide agréé
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-sable-600">
            {guide.ratingCount > 0 && (
              <Rating value={guide.ratingAvg} count={guide.ratingCount} />
            )}
            {guide.baseCity && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {guide.baseCity}
              </span>
            )}
            {guide.yearsExperience ? (
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                {guide.yearsExperience} an{guide.yearsExperience > 1 ? 's' : ''} d’expérience
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {guide.whatsapp && (
              <a
                href={whatsappUrl(guide.whatsapp, `Bonjour ${guide.fullName}, je vous contacte depuis Vanessa Tourisme.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: 'primary', size: 'sm' })}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
            )}
            {guide.phone && (
              <a href={telUrl(guide.phone)} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                Appeler
              </a>
            )}
            {guide.email && (
              <a href={`mailto:${guide.email}`} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                Écrire
              </a>
            )}
          </div>
        </div>
      </div>

      {guide.bio && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-sable-900">À propos</h2>
          <p className="mt-2 whitespace-pre-line text-sable-700">{guide.bio}</p>
        </div>
      )}

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-semibold text-sable-500">Langues parlées</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {guide.languages.map((code) => (
              <Badge key={code} tone="neutral">
                {SPOKEN_LANGUAGE_LABELS[code]}
              </Badge>
            ))}
          </dd>
        </div>

        {guide.specialties.length > 0 && (
          <div>
            <dt className="text-sm font-semibold text-sable-500">Spécialités</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {guide.specialties.map((specialty) => (
                <Badge key={specialty} tone="accent">
                  {specialty}
                </Badge>
              ))}
            </dd>
          </div>
        )}

        {guide.licenseNumber && (
          <div>
            <dt className="text-sm font-semibold text-sable-500">N° d’agrément</dt>
            <dd className="mt-1 text-sable-800">{guide.licenseNumber}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}