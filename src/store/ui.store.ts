import { create } from 'zustand'

/* ------------------------------------------------------------
   Etat d'interface : modale de connexion, menu mobile, toasts
------------------------------------------------------------ */
export type AuthModalMode = 'login' | 'signup'
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  /** Duree d'affichage en ms (0 = reste affiche) */
  duration: number
}

interface AuthModalState {
  open: boolean
  mode: AuthModalMode
  /** Page a ouvrir apres la connexion */
  redirectTo: string | null
}

interface UiState {
  authModal: AuthModalState
  mobileMenuOpen: boolean
  chatSidebarOpen: boolean
  toasts: Toast[]

  openAuthModal: (mode?: AuthModalMode, redirectTo?: string | null) => void
  closeAuthModal: () => void
  setAuthModalMode: (mode: AuthModalMode) => void

  setMobileMenuOpen: (open: boolean) => void
  setChatSidebarOpen: (open: boolean) => void

  pushToast: (toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => string
  dismissToast: (id: string) => void
}

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

export const useUiStore = create<UiState>()((set, get) => ({
  authModal: { open: false, mode: 'login', redirectTo: null },
  mobileMenuOpen: false,
  chatSidebarOpen: false,
  toasts: [],

  openAuthModal: (mode = 'login', redirectTo = null) =>
    set({ authModal: { open: true, mode, redirectTo }, mobileMenuOpen: false }),

  closeAuthModal: () =>
    set((state) => ({ authModal: { ...state.authModal, open: false } })),

  setAuthModalMode: (mode) =>
    set((state) => ({ authModal: { ...state.authModal, mode } })),

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setChatSidebarOpen: (open) => set({ chatSidebarOpen: open }),

  pushToast: ({ duration, ...toast }) => {
    const id = newId()
    const ms = duration ?? (toast.type === 'error' ? 6000 : 4000)

    set((state) => ({ toasts: [...state.toasts.slice(-3), { ...toast, id, duration: ms }] }))

    if (ms > 0) {
      setTimeout(() => get().dismissToast(id), ms)
    }
    return id
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))

/** Raccourcis utilisables partout, meme hors composants : toast.success('Enregistre') */
export const toast = {
  success: (title: string, description?: string) =>
    useUiStore.getState().pushToast({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    useUiStore.getState().pushToast({ type: 'error', title, description }),
  info: (title: string, description?: string) =>
    useUiStore.getState().pushToast({ type: 'info', title, description }),
  warning: (title: string, description?: string) =>
    useUiStore.getState().pushToast({ type: 'warning', title, description }),
}