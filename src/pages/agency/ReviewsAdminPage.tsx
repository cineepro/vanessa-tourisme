// src/pages/agency/ReviewsAdminPage.tsx — Vanessa Tourisme
import { useState } from 'react'
import { MessageSquareQuote } from 'lucide-react'

import { AdminHeader } from '@/components/agency/AdminHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Rating } from '@/components/ui/Rating'
import { Skeleton } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Textarea'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/appwrite'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { listAgencyReviews, moderateReview, replyToReview } from '@/services/reviews.service'
import { reviewPhotoOriginalUrl, reviewPhotoUrls } from '@/services/storage.service'
import { toast } from '@/store/ui.store'
import type { Review, ReviewStatus } from '@/types'
import { useAgency } from './AgencyContext'

const TABS: { key: ReviewStatus; label: string }[] = [
  { key: 'pending', label: 'À modérer' },
  { key: 'approved', label: 'Publiés' },
  { key: 'rejected', label: 'Refusés' },
]

function ReviewCard({ review, canEdit, onChanged }: { review: Review; canEdit: boolean; onChanged: () => void }) {
  const [reply, setReply] = useState(review.agencyReply ?? '')
  const [busy, setBusy] = useState<'approve' | 'reject' | 'reply' | null>(null)
  const photos = reviewPhotoUrls(review, { width: 240 })

  const moderate = async (decision: 'approve' | 'reject') => {
    setBusy(decision)
    try {
      await moderateReview(review.$id, decision)
      toast.success(decision === 'approve' ? 'Avis publié' : 'Avis refusé')
      onChanged()
    } catch (err) {
      toast.error('Action impossible', getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const sendReply = async () => {
    if (!reply.trim()) return
    setBusy('reply')
    try {
      await replyToReview(review.$id, reply.trim())
      toast.success('Réponse publiée')
      onChanged()
    } catch (err) {
      toast.error('Action impossible', getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className="rounded-3xl border border-sable-200 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sable-900">{review.userDisplayName}</p>
          <p className="text-xs text-sable-500">{formatDate(review.visitedAt ?? review.$createdAt, 'medium')}</p>
        </div>
        <div className="space-y-1 text-right">
          <div className="flex items-center justify-end gap-2 text-xs text-sable-500">
            Site <Rating value={review.ratingSite} size="sm" showValue={false} />
          </div>
          {review.ratingGuide != null && (
            <div className="flex items-center justify-end gap-2 text-xs text-sable-500">
              Guide <Rating value={review.ratingGuide} size="sm" showValue={false} />
            </div>
          )}
        </div>
      </div>

      {review.comment && <p className="mt-3 whitespace-pre-line text-sm text-sable-700">{review.comment}</p>}

      {photos.length > 0 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {photos.map((url, index) => (
            <li key={url} className="shrink-0">
              <a href={reviewPhotoOriginalUrl(review.photos[index]) ?? url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="" loading="lazy" className="h-20 w-20 rounded-xl object-cover" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="mt-4 space-y-4 border-t border-sable-100 pt-4">
          {review.status !== 'approved' && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" isLoading={busy === 'approve'} disabled={busy !== null} onClick={() => void moderate('approve')}>
                Publier
              </Button>
              {review.status === 'pending' && (
                <Button size="sm" variant="outline" isLoading={busy === 'reject'} disabled={busy !== null} onClick={() => void moderate('reject')}>
                  Refuser
                </Button>
              )}
            </div>
          )}

          {review.status === 'approved' && (
            <>
              <Textarea
                label="Votre réponse publique"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                maxLength={1000}
                showCounter
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void sendReply()} isLoading={busy === 'reply'} disabled={busy !== null || !reply.trim()}>
                  {review.agencyReply ? 'Mettre à jour la réponse' : 'Répondre'}
                </Button>
                <Button size="sm" variant="ghost" isLoading={busy === 'reject'} disabled={busy !== null} onClick={() => void moderate('reject')}>
                  Masquer l’avis
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {!canEdit && review.agencyReply && (
        <p className="mt-3 rounded-2xl bg-sable-100 px-4 py-3 text-sm text-sable-700">{review.agencyReply}</p>
      )}
    </li>
  )
}

export default function ReviewsAdminPage() {
  const { agency, canEdit } = useAgency()
  const [tab, setTab] = useState<ReviewStatus>('pending')

  const { data, isLoading, error, reload } = useAsync(() => listAgencyReviews(agency.$id, tab), [agency.$id, tab])

  return (
    <div>
      <AdminHeader
        title="Avis"
        description="Publiez les avis de vos clients et répondez-y. Seuls les avis publiés sont visibles des touristes."
      />

      <div className="mb-6 flex gap-2" role="tablist" aria-label="Statut des avis">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              tab === item.key ? 'bg-primary-600 text-white' : 'bg-white text-sable-700 hover:bg-sable-100',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading && !data ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-36 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Impossible de charger les avis" description={error} action={<Button variant="outline" onClick={reload}>Réessayer</Button>} />
      ) : !data || data.documents.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote className="h-6 w-6" aria-hidden="true" />}
          title="Aucun avis ici"
          description={tab === 'pending' ? 'Les nouveaux avis à modérer apparaîtront ici.' : 'Rien à afficher pour le moment.'}
        />
      ) : (
        <ul className="space-y-4">
          {data.documents.map((review) => (
            <ReviewCard key={review.$id} review={review} canEdit={canEdit} onChanged={reload} />
          ))}
        </ul>
      )}
    </div>
  )
}