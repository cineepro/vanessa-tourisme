// src/lib/validators.ts — Vanessa Tourisme
// Validations légères des formulaires (le serveur revalide toujours).

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/**
 * Nettoie un numéro de téléphone : "+229 01 23 45 67 89" -> "+2290123456789".
 * Renvoie null si le numéro est invalide.
 */
export function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s().-]/g, '')
  const withPlus = cleaned.startsWith('00') ? `+${cleaned.slice(2)}` : cleaned
  return /^\+?[0-9]{8,15}$/.test(withPlus) ? withPlus : null
}

/** Renvoie un message si le mot de passe est trop faible, sinon null. */
export function getPasswordIssue(password: string): string | null {
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
  return null
}