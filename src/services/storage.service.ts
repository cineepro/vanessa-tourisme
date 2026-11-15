import { BUCKETS } from '@/config/appwrite-ids'
import { filePreviewUrl, fileViewUrl, ID, storage, AppError } from '@/lib/appwrite'
import type { Agency, Article, Guide, Review, Site } from '@/types'

interface ImageSize {
  width?: number
  height?: number
}

/* ------------------------------------------------------------
   URLs d'images (null si pas de fichier : l'interface affiche un visuel par defaut)
------------------------------------------------------------ */
export const siteCoverUrl = (site: Pick<Site, 'coverId'>, size: ImageSize = { width: 800 }) =>
  filePreviewUrl(BUCKETS.sites, site.coverId, size)

export const siteGalleryUrls = (
  site: Pick<Site, 'gallery'>,
  size: ImageSize = { width: 1200 },
): string[] =>
  site.gallery
    .map((fileId) => filePreviewUrl(BUCKETS.sites, fileId, size))
    .filter((url): url is string => Boolean(url))

export const guidePhotoUrl = (
  guide: Pick<Guide, 'photoId'>,
  size: ImageSize = { width: 400, height: 400 },
) => filePreviewUrl(BUCKETS.guides, guide.photoId, size)

export const articleCoverUrl = (
  article: Pick<Article, 'coverId'>,
  size: ImageSize = { width: 800 },
) => filePreviewUrl(BUCKETS.articles, article.coverId, size)

export const agencyLogoUrl = (agency: Pick<Agency, 'logoId'>, size: ImageSize = { width: 200 }) =>
  filePreviewUrl(BUCKETS.agencies, agency.logoId, size)

export const agencyCoverUrl = (
  agency: Pick<Agency, 'coverId'>,
  size: ImageSize = { width: 1600 },
) => filePreviewUrl(BUCKETS.agencies, agency.coverId, size)

export const reviewPhotoUrls = (
  review: Pick<Review, 'photos'>,
  size: ImageSize = { width: 600 },
): string[] =>
  review.photos
    .map((fileId) => filePreviewUrl(BUCKETS.reviews, fileId, size))
    .filter((url): url is string => Boolean(url))

export const reviewPhotoOriginalUrl = (fileId: string) => fileViewUrl(BUCKETS.reviews, fileId)

/* ------------------------------------------------------------
   Envoi de photos d'avis
------------------------------------------------------------ */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_REVIEW_PHOTOS = 4
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** Renvoie un message d'erreur, ou null si le fichier est valide. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Format non pris en charge. Utilisez une image JPG, PNG, WebP ou AVIF.'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Cette image est trop lourde (5 Mo maximum).'
  }
  return null
}

/** Envoie une photo d'avis et renvoie l'ID du fichier a mettre dans `photos`. */
export async function uploadReviewPhoto(file: File): Promise<string> {
  const problem = validateImageFile(file)
  if (problem) throw new AppError(problem, 'INVALID_FILE')

  const uploaded = await storage.createFile({
    bucketId: BUCKETS.reviews,
    fileId: ID.unique(),
    file,
  })
  return uploaded.$id
}

export async function deleteReviewPhoto(fileId: string): Promise<void> {
  await storage.deleteFile({ bucketId: BUCKETS.reviews, fileId })
}