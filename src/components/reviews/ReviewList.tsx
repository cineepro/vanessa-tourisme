// src/components/reviews/ReviewList.tsx — Vanessa Tourisme
import { useCallback, useEffect, useState } from 'react'
import { MessageSquareQuote } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Rating } from '@/components/ui/Rating'
import { Skeleton } from '@/components/ui/Skeleton'
import { getErrorMessage } from '@/lib/appwrite'
import { formatDate, initials } from '@/lib/format'
import { listGuideReviews, listSiteReviews } from '@/services/reviews.service'
import { reviewPhotoOriginalUrl, reviewPhotoUrls } from '@/services/storage.service'
import type { Review } from '@/types'

interface ReviewListProps {
  /** Avis d'un site (ou d'un guide, avec guideId) */
  siteId?: string
  guideId?: string
  pageSize?: number
}

export function ReviewList({ siteId, guideId, pageSize = 6 }: ReviewListProps) {
  const [items, setItems] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (offset: number) => {
      setLoading(true)
      setError(null)
      try {
        const options = { limit: pageSize, offset }
        const result = siteId
          ? await listSiteReviews(siteId, options)
          : guideId
            ? await listGuideReviews(guideId, options)
            : { total: 0, documents: [] as Review[] }

        setTotal(result.total)
        setItems((current) => (offset === 0 ? result.documents : [...current, ...result.documents]))
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [siteId, guideId, pageSize],
  )

  useEffect(() => {
    void load(0)
  }, [load])

  if (loading && items.length === 0) {
    return (
      <div className="space-y-4" aria-hidden="true">
        {[0, 1].map((index) => (
          <Skeleton key={index} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
    )
  }

  if (error && items.length === 0) {
    return (
      <EmptyState
        title="Impossible de charger les avis"
        description={error}
        action={
          <Button variant="outline" onClick={() => void load(0)}>
            Réessayer
          </Button>
        }
      />
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquareQuote className="h-6 w-6" aria-hidden="true" />}
        title="Pas encore d’avis"
        description="Soyez le premier à partager votre expérience après votre visite."
      />
    )
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {items.map((review) => {
          const photos = reviewPhotoUrls(review, { width: 300 })
          return (
            <li key={review.$id} className="rounded-3xl border border-sable-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700"
                  aria-hidden="true"
                >
                  {initials(review.userDisplayName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-sable-900">{review.userDisplayName}</p>
                    <time className="text-xs text-sable-500" dateTime={review.visitedAt ?? review.$createdAt}>
                      {formatDate(review.visitedAt ?? review.$createdAt, 'medium')}
                    </time>
                  </div>
                  <Rating value={guideId ? (review.ratingGuide ?? 0) : review.ratingSite} size="sm" />
                </div>
              </div>

              {review.comment && <p className="mt-3 whitespace-pre-line text-sm text-sable-700">{review.comment}</p>}

              {photos.length > 0 && (
                <ul className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
                  {photos.map((url, index) => (
                    <li key={url} className="shrink-0">
                      <a
                        href={reviewPhotoOriginalUrl(review.photos[index]) ?? url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={url}
                          alt={`Photo de ${review.userDisplayName}`}
                          loading="lazy"
                          className="h-20 w-20 rounded-xl object-cover"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {review.agencyReply && (
                <div className="mt-4 rounded-2xl bg-sable-100 p-4 text-sm">
                  <p className="font-semibold text-sable-800">Réponse de l’agence</p>
                  <p className="mt-1 whitespace-pre-line text-sable-700">{review.agencyReply}</p>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {items.length < total && (
        <div className="text-center">
          <Button variant="outline" onClick={() => void load(items.length)} isLoading={loading}>
            Voir plus d’avis
          </Button>
        </div>
      )}
    </div>
  )
}