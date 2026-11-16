// src/components/chat/LocationConsent.tsx — Vanessa Tourisme
import { useState } from 'react'
import { MapPin } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useGeolocation } from '@/hooks/useGeolocation'
import { cn } from '@/lib/cn'
import { toast } from '@/store/ui.store'

interface LocationConsentProps {
  onEnabled?: () => void
  className?: string
}

/**
 * Consentement explicite au partage de position avec Vanessa.
 * La position n'est utilisée que pour trouver des lieux proches ; elle se
 * désactive à tout moment.
 */
export function LocationConsent({ onEnabled, className }: LocationConsentProps) {
  const { profile, updateProfile } = useAuth()
  const { request, isLoading, error } = useGeolocation()
  const [saving, setSaving] = useState(false)

  const enabled = Boolean(profile?.shareLocation)

  const enable = async () => {
    const position = await request()
    if (!position) return

    setSaving(true)
    const ok = await updateProfile({ shareLocation: true })
    setSaving(false)

    if (ok) {
      toast.success('Position activée', 'Vanessa peut maintenant vous trouver des lieux près de vous.')
      onEnabled?.()
    }
  }

  const disable = async () => {
    setSaving(true)
    const ok = await updateProfile({ shareLocation: false })
    setSaving(false)
    if (ok) toast.info('Partage de position désactivé')
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 sm:flex-row sm:items-center',
        className,
      )}
    >
      <MapPin className="h-6 w-6 shrink-0 text-primary-600" aria-hidden="true" />

      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-primary-900">
          {enabled ? 'Partage de position activé' : 'Partager ma position avec Vanessa'}
        </p>
        <p className="mt-0.5 text-primary-800">
          {enabled
            ? 'Vanessa utilise votre position pour trouver pharmacies, restaurants et sorties près de vous.'
            : 'Pour trouver la pharmacie ou le restaurant le plus proche, Vanessa a besoin de savoir où vous êtes. Vous pouvez désactiver cela à tout moment.'}
        </p>
        {error && <p className="mt-1 text-danger-700">{error}</p>}
      </div>

      {enabled ? (
        <Button variant="outline" size="sm" onClick={disable} isLoading={saving}>
          Désactiver
        </Button>
      ) : (
        <Button size="sm" onClick={enable} isLoading={isLoading || saving}>
          Activer ma position
        </Button>
      )}
    </div>
  )
}