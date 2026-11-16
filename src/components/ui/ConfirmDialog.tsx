// src/components/ui/ConfirmDialog.tsx — Vanessa Tourisme
import type { ReactNode } from 'react'

import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  /** Contenu additionnel (ex: champ de motif) */
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Demande de confirmation avant une action sensible. */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  )
}