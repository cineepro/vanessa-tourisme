// src/components/sites/SiteGallery.tsx — Vanessa Tourisme
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'

import { cn } from '@/lib/cn'
import { filePreviewUrl } from '@/lib/appwrite'
import { BUCKETS } from '@/config/appwrite-ids'
import type { Site } from '@/types'

interface SiteGalleryProps {
  site: Pick<Site, 'name' | 'coverId' | 'gallery'>
  className?: string
}

/** Photo principale, miniatures et visionneuse plein écran (clavier : flèches, Échap). */
export function SiteGallery({ site, className }: SiteGalleryProps) {
  const fileIds = [site.coverId, ...site.gallery].filter(
    (id, index, all): id is string => Boolean(id) && all.indexOf(id) === index,
  )

  const [lightbox, setLightbox] = useState<number | null>(null)

  const close = useCallback(() => setLightbox(null), [])
  const go = useCallback(
    (step: number) =>
      setLightbox((current) =>
        current === null ? null : (current + step + fileIds.length) % fileIds.length,
      ),
    [fileIds.length],
  )

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [lightbox, close, go])

  if (fileIds.length === 0) {
    return (
      <div
        className={cn(
          'flex aspect-[16/9] items-center justify-center rounded-3xl bg-gradient-to-br from-primary-100 to-accent-100',
          className,
        )}
      >
        <ImageOff className="h-10 w-10 text-primary-700/50" aria-hidden="true" />
        <span className="sr-only">Aucune photo disponible</span>
      </div>
    )
  }

  const thumbs = fileIds.slice(1, 5)
  const hidden = fileIds.length - 5

  return (
    <>
      <div
        className={cn(
          'grid gap-2 overflow-hidden rounded-3xl',
          thumbs.length > 0 ? 'md:grid-cols-4 md:grid-rows-2' : '',
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setLightbox(0)}
          className={cn(
            'relative aspect-[16/10] overflow-hidden bg-sable-200',
            thumbs.length > 0 && 'md:col-span-2 md:row-span-2 md:aspect-auto',
          )}
          aria-label={`Agrandir la photo de ${site.name}`}
        >
          <img
            src={filePreviewUrl(BUCKETS.sites, fileIds[0], { width: 1200 }) ?? ''}
            alt={site.name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </button>

        {thumbs.map((fileId, index) => (
          <button
            key={fileId}
            type="button"
            onClick={() => setLightbox(index + 1)}
            className="relative hidden aspect-[4/3] overflow-hidden bg-sable-200 md:block"
            aria-label={`Agrandir la photo ${index + 2} de ${site.name}`}
          >
            <img
              src={filePreviewUrl(BUCKETS.sites, fileId, { width: 500 }) ?? ''}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            {index === thumbs.length - 1 && hidden > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-sable-900/60 text-lg font-bold text-white">
                +{hidden}
              </span>
            )}
          </button>
        ))}
      </div>

      {lightbox !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Photos de ${site.name}`}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>

            {fileIds.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Photo précédente"
                  className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Photo suivante"
                  className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}

            <img
              src={filePreviewUrl(BUCKETS.sites, fileIds[lightbox], { width: 1800, quality: 85 }) ?? ''}
              alt={`${site.name}, photo ${lightbox + 1} sur ${fileIds.length}`}
              className="max-h-[88vh] max-w-[94vw] rounded-xl object-contain"
            />

            <p className="absolute bottom-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {lightbox + 1} / {fileIds.length}
            </p>
          </div>,
          document.body,
        )}
    </>
  )
}