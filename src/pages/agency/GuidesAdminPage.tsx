// src/pages/agency/GuidesAdminPage.tsx — Vanessa Tourisme
import { useState } from 'react'
import { BadgeCheck, Pencil, Plus, Trash2, Users } from 'lucide-react'

import { AdminHeader } from '@/components/agency/AdminHeader'
import { GuideForm } from '@/components/agency/GuideForm'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { SPOKEN_LANGUAGE_LABELS } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/appwrite'
import { initials } from '@/lib/format'
import { deleteGuide, listAgencyGuides, listSelectableSites } from '@/services/admin.service'
import { guidePhotoUrl } from '@/services/storage.service'
import { toast } from '@/store/ui.store'
import type { Guide, GuideStatus } from '@/types'
import { useAgency } from './AgencyContext'

const STATUS: Record<GuideStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Actif', tone: 'primary' },
  pending: { label: 'En attente', tone: 'accent' },
  inactive: { label: 'Inactif', tone: 'neutral' },
}

export default function GuidesAdminPage() {
  const { agency, canEdit, canManage } = useAgency()

  const guides = useAsync(() => listAgencyGuides(agency.$id), [agency.$id])
  const sites = useAsync(() => listSelectableSites(agency.$id), [agency.$id])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Guide | null>(null)
  const [toDelete, setToDelete] = useState<Guide | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openForm = (guide: Guide | null) => {
    setEditing(guide)
    setFormOpen(true)
  }
  const closeForm = () => setFormOpen(false)

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteGuide(toDelete.$id)
      toast.success('Guide supprimé')
      setToDelete(null)
      guides.reload()
    } catch (err) {
      toast.error('Suppression impossible', getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const list = guides.data

  return (
    <div>
      <AdminHeader
        title="Guides"
        description="Les guides de votre agence, leurs langues et les sites qu’ils couvrent."
        action={
          canEdit && (
            <Button onClick={() => openForm(null)} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Ajouter un guide
            </Button>
          )
        }
      />

      {guides.isLoading && !list ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 rounded-3xl" />
          ))}
        </div>
      ) : guides.error ? (
        <EmptyState title="Impossible de charger les guides" description={guides.error} action={<Button variant="outline" onClick={guides.reload}>Réessayer</Button>} />
      ) : !list || list.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden="true" />}
          title="Aucun guide"
          description="Ajoutez vos guides pour afficher leurs profils et leurs tarifs."
          action={canEdit ? <Button onClick={() => openForm(null)}>Ajouter un guide</Button> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((guide) => {
            const photo = guidePhotoUrl(guide, { width: 160, height: 160 })
            const badge = STATUS[guide.status]
            return (
              <li key={guide.$id} className="flex items-center gap-4 rounded-3xl border border-sable-200 bg-white p-3 shadow-card sm:p-4">
                {photo ? (
                  <img src={photo} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-100 font-display text-xl font-bold text-primary-700">
                    {initials(guide.fullName)}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-base font-bold text-sable-900">{guide.fullName}</h3>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    {guide.certified && (
                      <Badge tone="primary" icon={<BadgeCheck className="h-3 w-3" aria-hidden="true" />}>
                        Agréé
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-sable-500">
                    {guide.languages.map((code) => SPOKEN_LANGUAGE_LABELS[code]).join(', ')} · {guide.siteIds.length} site
                    {guide.siteIds.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openForm(guide)}
                      aria-label={`Modifier ${guide.fullName}`}
                      className="rounded-full p-2.5 text-sable-600 hover:bg-sable-100"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setToDelete(guide)}
                      aria-label={`Supprimer ${guide.fullName}`}
                      className="rounded-full p-2.5 text-sable-500 hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={formOpen} onClose={closeForm} title={editing ? `Modifier : ${editing.fullName}` : 'Nouveau guide'} size="lg" closeOnOverlay={false}>
        <GuideForm
          key={editing?.$id ?? 'new'}
          agency={agency}
          initial={editing}
          sites={sites.data ?? []}
          onCancel={closeForm}
          onSaved={() => {
            closeForm()
            guides.reload()
          }}
        />
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer ce guide ?"
        description={
          toDelete
            ? `${toDelete.fullName} sera définitivement supprimé. Pour le masquer sans le supprimer, passez-le en « Inactif ».`
            : undefined
        }
        confirmLabel="Supprimer"
        danger
        isLoading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}