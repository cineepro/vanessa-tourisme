// src/components/auth/AuthModal.tsx — Vanessa Tourisme
import { useNavigate } from 'react-router-dom'

import { Modal } from '@/components/ui/Modal'
import { useUiStore } from '@/store/ui.store'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

/** Fenêtre de connexion / inscription globale (à placer une fois dans le routeur). */
export function AuthModal() {
  const { open, mode, redirectTo } = useUiStore((s) => s.authModal)
  const closeAuthModal = useUiStore((s) => s.closeAuthModal)
  const setAuthModalMode = useUiStore((s) => s.setAuthModalMode)
  const navigate = useNavigate()

  const handleSuccess = () => {
    closeAuthModal()
    if (redirectTo) navigate(redirectTo)
  }

  const isLogin = mode === 'login'

  return (
    <Modal
      open={open}
      onClose={closeAuthModal}
      title={isLogin ? 'Bon retour !' : 'Créer votre compte'}
      description={
        isLogin
          ? 'Connectez-vous pour discuter avec Vanessa et réserver.'
          : 'Un seul compte pour Vanessa et Vanessa Tourisme.'
      }
    >
      {isLogin ? (
        <LoginForm onSuccess={handleSuccess} onNavigate={closeAuthModal} next={redirectTo ?? '/'} />
      ) : (
        <SignupForm onNavigate={closeAuthModal} next={redirectTo ?? '/'} />
      )}

      <p className="mt-6 text-center text-sm text-sable-600">
        {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
        <button
          type="button"
          onClick={() => setAuthModalMode(isLogin ? 'signup' : 'login')}
          className="font-semibold text-primary-700 hover:underline"
        >
          {isLogin ? 'Créer un compte' : 'Se connecter'}
        </button>
      </p>
    </Modal>
  )
}