// src/components/reviews/ReviewForm.tsx — Vanessa Tourisme
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CircleCheck, ImagePlus, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import { Textarea } from '@/components/ui/Textarea'
import { BUCKETS } from '@/config/appwrite-ids'
import { filePreviewUrl, getErrorMessage } from '@/lib/appwrite'
import { createReview } from '@/services/reviews.service'
import {
  MAX_REVIEW_PHOTOS,
  deleteReviewPhoto,
  uploadReviewPhoto,
  validateImageFile,
} from '@/services/storage.service'
import { toast } from '@/store/ui.store'
import type { Booking, Review } from '@/types'

interface ReviewFormProps {
  booking: Booking
  onSubmitted?: (review: Review) => void
}

export function ReviewForm({ booking, onSubmitted }: ReviewFormProps) {
  const [ratingSite, setRatingSite] = useState(0)
  const [ratingGuide, setRatingGuide] = useState(0)
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const room = MAX_REVIEW_PHOTOS - photos.length
    if (room <= 0) {
      setError(`Vous pouvez ajouter ${MAX_REVIEW_PHOTOS} photos au maximum.`)
      return
    }

    setError(null)
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of files.slice(0, room)) {
        const problem = validateImageFile(file)
        if (problem) {
          setError(problem)
          continue
        }
        uploaded.push(await uploadReviewPhoto(file))
      }
      setPhotos((current) => [...current, ...uploaded])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async (fileId: string) => {
    setPhotos((current) => current.filter((id) => id !== fileId))
    try {
      await deleteReviewPhoto(fileId)
    } catch {
      /* le fichier orphelin sera nettoyé côté serveur */
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (ratingSite < 1) {
      setError('Donnez une note au site.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const review = await createReview({
        bookingId: booking.$id,
        ratingSite,
        ratingGuide: booking.guideId && ratingGuide > 0 ? ratingGuide : undefined,
        comment: comment.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
      })
      setDone(true)
      toast.success('Merci pour votre avis !')
      onSubmitted?.(review)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-3xl border border-primary-200 bg-primary-50 p-5">
        <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary-600" aria-hidden="true" />
        <div>
          <h3 className="font-display text-lg font-bold text-primary-900">Merci !</h3>
          <p className="mt-1 text-sm text-primary-800">
            Votre avis sera publié après une courte vérification.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-sable-200 bg-white p-5 sm:p-6">
      <div>
        <h3 className="font-display text-lg font-bold text-sable-900">Votre avis</h3>
        <p className="text-sm text-sable-500">
          {booking.siteName ?? 'Votre visite'} · aidez les prochains voyageurs à bien choisir.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-sable-800">Note du site</p>
        <Rating value={ratingSite} onChange={setRatingSite} size="lg" />
      </div>

      {booking.guideId && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-sable-800">
            Note du guide{booking.guideName ? ` (${booking.guideName})` : ''} · optionnel
          </p>
          <Rating value={ratingGuide} onChange={setRatingGuide} size="lg" />
        </div>
      )}

      <Textarea
        label="Votre expérience (optionnel)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={2000}
        showCounter
        rows={5}
        placeholder="Ce que vous avez aimé, ce qui vous a surpris…"
      />

      <div>
        <p className="mb-2 text-sm font-medium text-sable-800">
          Photos (optionnel, {MAX_REVIEW_PHOTOS} maximum)
        </p>
        <div className="flex flex-wrap gap-3">
          {photos.map((fileId) => (
            <div key={fileId} className="relative">
              <img
                src={filePreviewUrl(BUCKETS.reviews, fileId, { width: 200, height: 200 }) ?? ''}
                alt="Photo ajoutée"
                className="h-20 w-20 rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => void removePhoto(fileId)}
                aria-label="Retirer cette photo"
                className="absolute -right-2 -top-2 rounded-full bg-sable-900 p-1 text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}

          {photos.length < MAX_REVIEW_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sable-300 text-xs text-sable-500 hover:bg-sable-100 disabled:opacity-50"
            >
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
              {uploading ? 'Envoi…' : 'Ajouter'}
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger-700">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" isLoading={submitting} disabled={uploading}>
        Publier mon avis
      </Button>
    </form>
  )
}