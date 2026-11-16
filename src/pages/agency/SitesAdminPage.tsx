// src/pages/agency/SitesAdminPage.tsx — Vanessa Tourisme
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'

import { AdminHeader } from '@/components/agency/AdminHeader'
import { SiteForm } from '@/components/agency/SiteForm'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { getErrorMessage } from '@/lib/appwrite'
import { deleteSite, listAgencySites } from '@/services/admin.service'
import { siteCoverUrl } from '@/services/storage.service'
import { toast } from '@/store/ui.store'
import type { PublishStatus, Site } from '@/types'
import { useAgency } from './AgencyContext'

const STATUS: Record<PublishStatus, { label: string; tone: BadgeTone }> = {
  published: { label: 'Publié', tone: 'primary' },
  draft: { label: 'Brouillon', tone: 'neutral' },
  archived: { label: 'Archivé', tone: 'accent' },
}

export default function SitesAdminPage() {
  const { agency, canEdit, canManage } = useAgency()

  const [search, setSearch] = useState('')
  const q = useDebounce(search, 350)
  const [status, setStatus] = useState<PublishStatus | ''>('')

  const { data, isLoading, error, reload } = useAsync(
    () => listAgencySites(agency.$id, { q: q.trim() || undefined, status: status || undefined }),
    [agency.$id, q, status],
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Site | null>(null)
  const [toDelete, setToDelete] = useState<Site | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openForm = (site: Site | null) => {
    setEditing(site)
    setFormOpen(true)
  }
  const closeForm = () => setFormOpen(false)

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteSite(toDelete.$id)
      toast.success('Site supprimé')
      setToDelete(null)
      reload()
    } catch (err) {
      toast.error('Suppression impossible', getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <AdminHeader
        title="Sites"
        description="Les sites touristiques de votre agence. Un site en brouillon n’est pas visible des touristes."
        action={
          canEdit && (
            <Button onClick={() => openForm(null)} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Nouveau site
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sable-500" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un site…"
            aria-label="Rechercher un site"
            className="h-11 w-full rounded-full border border-sable-300 bg-white pl-11 pr-4 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as PublishStatus | '')}
          aria-label="Filtrer par statut"
          className="h-11 rounded-full border border-sable-300 bg-white px-4 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        >
          <option value="">Tous les statuts</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
          <option value="archived">Archivés</option>
        </select>
      </div>

      {isLoading && !data ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Impossible de charger les sites" description={error} action={<Button variant="outline" onClick={reload}>Réessayer</Button>} />
      ) : !data || data.documents.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-6 w-6" aria-hidden="true" />}
          title="Aucun site"
          description="Ajoutez votre premier site pour qu’il apparaisse sur la plateforme."
          action={canEdit ? <Button onClick={() => openForm(null)}>Ajouter un site</Button> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {data.documents.map((site) => {
            const cover = siteCoverUrl(site, { width: 200, height: 200 })
            const badge = STATUS[site.status]
            return (
              <li key={site.$id} className="flex items-center gap-4 rounded-3xl border border-sable-200 bg-white p-3 shadow-card sm:p-4">
                {cover ? (
                  <img src={cover} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover sm:h-20 sm:w-20" />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 sm:h-20 sm:w-20">
                    <Compass className="h-6 w-6" aria-hidden="true" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-base font-bold text-sable-900">{site.name}</h3>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    {site.featured && (
                      <Badge tone="accent" icon={<Star className="h-3 w-3" aria-hidden="true" />}>
                        À la une
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-sable-500">
                    {site.city}, {site.department}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {site.status === 'published' && (
                    <Link to={ROUTES.site(site.slug)} className="rounded-full px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">
                      Voir
                    </Link>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openForm(site)}
                      aria-label={`Modifier ${site.name}`}
                      className="rounded-full p-2.5 text-sable-600 hover:bg-sable-100"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setToDelete(site)}
                      aria-label={`Supprimer ${site.name}`}
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

      <Modal open={formOpen} onClose={closeForm} title={editing ? `Modifier : ${editing.name}` : 'Nouveau site'} size="lg" closeOnOverlay={false}>
        <SiteForm
          key={editing?.$id ?? 'new'}
          agency={agency}
          initial={editing}
          onCancel={closeForm}
          onSaved={() => {
            closeForm()
            reload()
          }}
        />
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer ce site ?"
        description={
          toDelete
            ? `« ${toDelete.name} » sera définitivement supprimé. Les offres et réservations qui s’y rapportent ne s’afficheront plus correctement : préférez l’archivage si le site a déjà été réservé.`
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