// src/pages/agency/OffersAdminPage.tsx — Vanessa Tourisme
import { useMemo, useState } from 'react'
import { CalendarClock, Pencil, Plus, Tag, Trash2 } from 'lucide-react'

import { AdminHeader } from '@/components/agency/AdminHeader'
import { AvailabilityManager } from '@/components/agency/AvailabilityManager'
import { OfferForm } from '@/components/agency/OfferForm'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { PRICING_TYPE_LABELS } from '@/config/constants'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/appwrite'
import { formatDuration, formatPrice } from '@/lib/format'
import {
  deleteOffer,
  listAgencyGuides,
  listAgencyOffers,
  listSelectableSites,
  setOfferActive,
} from '@/services/admin.service'
import { toast } from '@/store/ui.store'
import type { Offer } from '@/types'
import { useAgency } from './AgencyContext'

export default function OffersAdminPage() {
  const { agency, canEdit, canManage } = useAgency()

  const offers = useAsync(() => listAgencyOffers(agency.$id), [agency.$id])
  const sites = useAsync(() => listSelectableSites(agency.$id), [agency.$id])
  const guides = useAsync(() => listAgencyGuides(agency.$id), [agency.$id])

  const siteNames = useMemo(() => new Map((sites.data ?? []).map((site) => [site.$id, site.name])), [sites.data])
  const guideNames = useMemo(() => new Map((guides.data ?? []).map((guide) => [guide.$id, guide.fullName])), [guides.data])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [slotsFor, setSlotsFor] = useState<Offer | null>(null)
  const [toDelete, setToDelete] = useState<Offer | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openForm = (offer: Offer | null) => {
    setEditing(offer)
    setFormOpen(true)
  }
  const closeForm = () => setFormOpen(false)

  const toggleActive = async (offer: Offer) => {
    try {
      await setOfferActive(offer.$id, !offer.isActive)
      offers.reload()
    } catch (err) {
      toast.error('Action impossible', getErrorMessage(err))
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteOffer(toDelete.$id)
      toast.success('Offre supprimée')
      setToDelete(null)
      offers.reload()
    } catch (err) {
      toast.error('Suppression impossible', getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const list = offers.data

  return (
    <div>
      <AdminHeader
        title="Offres et tarifs"
        description="Chaque offre associe un site, un guide et un tarif. Les touristes la réservent depuis la fiche du site."
        action={
          canEdit && (
            <Button onClick={() => openForm(null)} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Nouvelle offre
            </Button>
          )
        }
      />

      {offers.isLoading && !list ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-28 rounded-3xl" />
          ))}
        </div>
      ) : offers.error ? (
        <EmptyState title="Impossible de charger les offres" description={offers.error} action={<Button variant="outline" onClick={offers.reload}>Réessayer</Button>} />
      ) : !list || list.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-6 w-6" aria-hidden="true" />}
          title="Aucune offre"
          description="Créez une offre pour que les touristes puissent réserver une visite guidée."
          action={canEdit ? <Button onClick={() => openForm(null)}>Créer une offre</Button> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((offer) => (
            <li key={offer.$id} className="rounded-3xl border border-sable-200 bg-white p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-sable-900">{offer.title}</h3>
                    <Badge tone={offer.isActive ? 'primary' : 'neutral'}>{offer.isActive ? 'Active' : 'Désactivée'}</Badge>
                    {offer.bookingMode === 'slots' && <Badge tone="info">Sur créneaux</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-sable-500">
                    {siteNames.get(offer.siteId) ?? 'Site introuvable'}
                    {offer.guideId ? ` · ${guideNames.get(offer.guideId) ?? 'Guide introuvable'}` : ''}
                    {offer.durationMinutes ? ` · ${formatDuration(offer.durationMinutes)}` : ''}
                  </p>
                </div>

                <p className="text-right">
                  <span className="block font-display text-xl font-bold text-sable-900">
                    {formatPrice(offer.price, offer.currency)}
                  </span>
                  <span className="text-xs text-sable-500">{PRICING_TYPE_LABELS[offer.pricingType]}</span>
                </p>
              </div>

              {canEdit && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sable-100 pt-3">
                  <Button variant="outline" size="sm" onClick={() => openForm(offer)} leftIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}>
                    Modifier
                  </Button>
                  {offer.bookingMode === 'slots' && (
                    <Button variant="outline" size="sm" onClick={() => setSlotsFor(offer)} leftIcon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}>
                      Créneaux
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => void toggleActive(offer)}>
                    {offer.isActive ? 'Désactiver' : 'Activer'}
                  </Button>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setToDelete(offer)}
                      aria-label={`Supprimer ${offer.title}`}
                      className="ml-auto rounded-full p-2.5 text-sable-500 hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={formOpen} onClose={closeForm} title={editing ? `Modifier : ${editing.title}` : 'Nouvelle offre'} size="lg" closeOnOverlay={false}>
        <OfferForm
          key={editing?.$id ?? 'new'}
          agency={agency}
          initial={editing}
          sites={sites.data ?? []}
          guides={guides.data ?? []}
          onCancel={closeForm}
          onSaved={() => {
            closeForm()
            offers.reload()
          }}
        />
      </Modal>

      <Modal open={slotsFor !== null} onClose={() => setSlotsFor(null)} title={slotsFor ? `Créneaux : ${slotsFor.title}` : 'Créneaux'} size="lg">
        {slotsFor && <AvailabilityManager offer={slotsFor} agency={agency} />}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer cette offre ?"
        description={
          toDelete
            ? `« ${toDelete.title} » sera définitivement supprimée. Pour la retirer sans la supprimer (et garder l’historique des réservations), désactivez-la plutôt.`
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