// src/components/agency/ImageUploader.tsx — Vanessa Tourisme
import { useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'

import { BUCKETS } from '@/config/appwrite-ids'
import { filePreviewUrl, getErrorMessage } from '@/lib/appwrite'
import { cn } from '@/lib/cn'
import { uploadImage, type ImageBucket } from '@/services/admin.service'
import { validateImageFile } from '@/services/storage.service'

interface ImageUploaderProps {
  label: string
  bucket: ImageBucket
  /** IDs des fichiers déjà envoyés */
  value: string[]
  onChange: (fileIds: string[]) => void
  /** Nombre maximum de photos (1 = photo unique) */
  max?: number
  hint?: string
}

export function ImageUploader({ label, bucket, value, onChange, max = 1, hint }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const room = max - value.length
    if (room <= 0) {
      setError(`${max} photo${max > 1 ? 's' : ''} maximum.`)
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
        uploaded.push(await uploadImage(bucket, file))
      }
      onChange(max === 1 ? uploaded.slice(0, 1) : [...value, ...uploaded])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const canAdd = max === 1 ? true : value.length < max

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-sable-800">{label}</p>

      <div className="flex flex-wrap gap-3">
        {value.map((fileId) => (
          <div key={fileId} className="relative">
            <img
              src={filePreviewUrl(BUCKETS[bucket], fileId, { width: 240, height: 240 }) ?? ''}
              alt=""
              className="h-24 w-24 rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((id) => id !== fileId))}
              aria-label="Retirer cette photo"
              className="absolute -right-2 -top-2 rounded-full bg-sable-900 p-1 text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-sable-300 text-xs text-sable-500 hover:bg-sable-100 disabled:opacity-50',
            )}
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
            {uploading ? 'Envoi…' : max === 1 && value.length > 0 ? 'Remplacer' : 'Ajouter'}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={max > 1}
        onChange={handleFiles}
        className="hidden"
      />

      {hint && !error && <p className="mt-1.5 text-xs text-sable-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  )
}