// src/services/auth.service.ts — Vanessa Tourisme
// Reprend EXACTEMENT le flux de Vanessa (src/features/auth/services/authService.ts) :
//   1. Un compte non vérifié n'a JAMAIS de session conservée ni de profil.
//   2. Le document `users` n'est créé qu'une fois l'email vérifié (au premier
//      login réussi ou au retour de Google), avec les mêmes champs que
//      dbService.createUserProfile de Vanessa.
//   3. Google : createOAuth2Token + createSession (pas de cookie tiers).
// Les comptes et la collection `users` sont partagés avec Vanessa : un compte
// créé là-bas se connecte ici avec les mêmes identifiants, et inversement.
import {
  account,
  AppError,
  AppwriteException,
  createDocument,
  getDocument,
  ID,
  listDocuments,
  OAuthProvider,
  Permission,
  Query,
  Role,
  teams,
  updateDocument,
} from '@/lib/appwrite'
import { COLLECTIONS } from '@/config/appwrite-ids'
import type {
  Agency,
  AgencyMembership,
  AgencyRole,
  SessionUser,
  TouristProfile,
  TouristProfileInput,
  UserDoc,
  UserRole,
} from '@/types'

/* ------------------------------------------------------------
   Stockage de session (mêmes clés que Vanessa)
------------------------------------------------------------ */
const PENDING = {
  email: 'pendingVerificationEmail',
  userId: 'pendingVerificationUserId',
  phone: 'pendingPhone',
} as const

const NEXT_KEY = 'vt-auth-next'

const tempStore = {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value)
    } catch {
      /* stockage indisponible : on continue sans */
    }
  },
  remove(key: string): void {
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* rien */
    }
  },
}

const origin = (): string => window.location.origin

/** N'autorise que les chemins internes (évite les redirections vers un autre site). */
export function sanitizeRedirect(path: string | null | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/'
  return path
}

function isNotFound(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 404
}

function isConflict(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 409
}

/* ------------------------------------------------------------
   Compte Appwrite
------------------------------------------------------------ */
interface AccountModel {
  $id: string
  $createdAt: string
  name: string
  email: string
  emailVerification: boolean
  labels: string[]
  prefs: unknown
}

function toSessionUser(model: AccountModel): SessionUser {
  return {
    id: model.$id,
    name: model.name || model.email.split('@')[0] || 'Voyageur',
    email: model.email,
    emailVerified: model.emailVerification,
    labels: model.labels ?? [],
    prefs: (model.prefs ?? {}) as Record<string, unknown>,
    createdAt: model.$createdAt,
  }
}

/** Compte connecté (vérifié ou non), ou null pour un visiteur. */
async function getAccountUser(): Promise<SessionUser | null> {
  try {
    return toSessionUser(await account.get())
  } catch (error) {
    if (error instanceof AppwriteException && (error.code === 401 || error.code === 403)) {
      return null
    }
    throw error
  }
}

/**
 * Utilisateur connecté ET dont l'email est vérifié (règle de Vanessa :
 * isAuthenticated est strictement lié à emailVerification === true).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const user = await getAccountUser()
  return user && user.emailVerified ? user : null
}

async function endSession(): Promise<void> {
  try {
    await account.deleteSession('current')
  } catch {
    /* silencieux, comme sur Vanessa */
  }
}

export async function logout(): Promise<void> {
  try {
    await account.deleteSession('current')
  } catch (error) {
    if (!(error instanceof AppwriteException && (error.code === 401 || error.code === 404))) {
      throw error
    }
  }
}

/* ------------------------------------------------------------
   Connexion email + mot de passe
------------------------------------------------------------ */
/**
 * Ne renvoie JAMAIS une session valide pour un compte non vérifié : la session
 * est détruite et l'erreur EMAIL_NOT_VERIFIED est levée.
 */
export async function loginWithEmail(email: string, password: string): Promise<SessionUser> {
  const cleanEmail = email.trim()

  try {
    await account.createEmailPasswordSession(cleanEmail, password)
  } catch (error) {
    // Déjà connecté : on réutilise la session existante
    if (!(error instanceof AppwriteException && error.type === 'user_session_already_exists')) {
      throw error
    }
  }

  let current: SessionUser | null
  try {
    current = await getAccountUser()
  } catch (error) {
    await endSession()
    throw error
  }

  if (!current) {
    throw new AppError('Connexion impossible. Veuillez réessayer.', 'LOGIN_FAILED')
  }

  if (!current.emailVerified) {
    await endSession()
    tempStore.set(PENDING.email, cleanEmail)
    throw new AppError(
      'Veuillez d’abord confirmer votre adresse email.',
      'EMAIL_NOT_VERIFIED',
    )
  }

  return current
}

export interface SignUpInput {
  name: string
  email: string
  password: string
  /** Déjà normalisé (voir lib/validators.normalizePhone) */
  phone?: string
}

/**
 * Inscription : crée le compte, envoie l'email de vérification puis détruit
 * la session (accès interdit avant vérification). Comme sur Vanessa.
 */
export async function signUpWithEmail({ name, email, password, phone }: SignUpInput): Promise<void> {
  const cleanEmail = email.trim()
  const cleanName = name.trim()

  try {
    await account.create(ID.unique(), cleanEmail, password, cleanName)
  } catch (error) {
    if (
      error instanceof AppwriteException &&
      (error.code === 409 || error.type === 'user_already_exists')
    ) {
      throw new AppError(
        'Un compte existe déjà avec cette adresse email, peut-être créé sur Vanessa. Connectez-vous avec les mêmes identifiants.',
        'ACCOUNT_EXISTS',
        409,
      )
    }
    throw error
  }

  // Session temporaire (nécessaire pour createVerification)
  await account.createEmailPasswordSession(cleanEmail, password)

  try {
    const current = await getAccountUser()
    if (!current) throw new AppError('Impossible de récupérer le compte après connexion.')

    tempStore.set(PENDING.email, cleanEmail)
    tempStore.set(PENDING.userId, current.id)
    if (phone) tempStore.set(PENDING.phone, phone)

    // Tentative douce de pré-création du profil (silencieuse si les
    // permissions l'interdisent avant vérification)
    try {
      await ensureUserDoc(current)
    } catch {
      /* normal : le profil sera créé au premier login vérifié */
    }

    await account.createVerification(`${origin()}/email-confirmed`)
  } finally {
    // Accès interdit avant vérification : on détruit la session (2 essais)
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await account.deleteSession('current')
        break
      } catch (error) {
        console.warn(`[auth] deleteSession échoué (tentative ${attempt + 1}/2) :`, error)
      }
    }
  }
}

/* ------------------------------------------------------------
   Vérification de l'email
------------------------------------------------------------ */
export function getPendingVerificationEmail(): string | null {
  return tempStore.get(PENDING.email)
}

export function clearPendingVerification(): void {
  tempStore.remove(PENDING.email)
  tempStore.remove(PENDING.userId)
}

/** Renvoie le lien de vérification (ouvre une session temporaire, puis la détruit). */
export async function resendVerificationEmail(email: string, password: string): Promise<void> {
  try {
    await account.createEmailPasswordSession(email.trim(), password)
  } catch (error) {
    if (!(error instanceof AppwriteException && error.type === 'user_session_already_exists')) {
      throw error
    }
  }

  try {
    await account.createVerification(`${origin()}/email-confirmed`)
  } finally {
    await endSession()
  }
}

/** Page /email-confirmed : valide le lien reçu par email (?userId=...&secret=...). */
export async function confirmVerification(userId: string, secret: string): Promise<void> {
  await account.updateVerification(userId, secret)
  tempStore.remove(PENDING.userId)
}

/* ------------------------------------------------------------
   Google (createOAuth2Token : pas de cookie tiers, comme Vanessa)
------------------------------------------------------------ */
export function loginWithGoogle(next = '/'): void {
  tempStore.set(NEXT_KEY, sanitizeRedirect(next))
  void account.createOAuth2Token(
    OAuthProvider.Google,
    `${origin()}/oauth-callback`,
    `${origin()}/login`,
  )
}

/** Page /oauth-callback : crée la session à partir de ?userId=...&secret=... */
export async function completeOAuthSession(userId: string, secret: string): Promise<SessionUser> {
  await account.createSession(userId, secret)
  const user = await getCurrentUser()
  if (!user) throw new AppError('La connexion avec Google a échoué. Veuillez réessayer.')
  return user
}

/** Page à ouvrir après la connexion Google (mémorisée avant la redirection). */
export function consumeAuthRedirect(): string {
  const next = tempStore.get(NEXT_KEY)
  tempStore.remove(NEXT_KEY)
  return sanitizeRedirect(next)
}

/* ------------------------------------------------------------
   Mot de passe
------------------------------------------------------------ */
export async function requestPasswordReset(email: string): Promise<void> {
  await account.createRecovery(email.trim(), `${origin()}/reset-password`)
}

export async function confirmPasswordReset(
  userId: string,
  secret: string,
  password: string,
): Promise<void> {
  await account.updateRecovery(userId, secret, password)
}

export async function updateAccountName(name: string): Promise<SessionUser> {
  return toSessionUser(await account.updateName(name.trim()))
}

export async function changePassword(oldPassword: string, password: string): Promise<void> {
  await account.updatePassword(password, oldPassword)
}

/* ------------------------------------------------------------
   Collection partagée `users` (anti-doublon avec Vanessa)
   Le document a pour $id l'ID du compte (dbService.getUserProfile).
------------------------------------------------------------ */
async function userDocExists(userId: string): Promise<boolean> {
  try {
    await getDocument<UserDoc>(COLLECTIONS.users, userId)
    return true
  } catch (error) {
    if (isNotFound(error)) return false
    throw error
  }
}

/**
 * Crée le document `users` s'il n'existe pas. Reproduit EXACTEMENT les champs
 * et valeurs par défaut de dbService.createUserProfile (Vanessa), car la
 * collection exige ces attributs.
 */
export async function ensureUserDoc(user: SessionUser): Promise<void> {
  if (await userDocExists(user.id)) return

  // Téléphone saisi à l'inscription (optionnel)
  const pendingPhone = tempStore.get(PENDING.phone)

  try {
    await createDocument<UserDoc>(
      COLLECTIONS.users,
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: pendingPhone || '',
        avatarUrl: '',
        followers: 0,
        following: 0,
        isVerified: false,
        isCreative: false,
        balance: 0,
        bio: '',
        gossipLevel: 1,
        reputationScore: 0,
        reliabilityIndex: 50,
        storiesCount: 0,
        revelationsCount: 0,
        commentsCount: 0,
        predictionsCorrect: 0,
        predictionsTotal: 0,
        defaultAnonymous: false,
        isModerator: false,
        isBanned: false,
        newsletterOptOut: false,
        createdAt: new Date().toISOString(),
      },
      { documentId: user.id },
    )
    tempStore.remove(PENDING.phone)
  } catch (error) {
    if (!isConflict(error)) throw error
  }
}

/* ------------------------------------------------------------
   Profil touriste (collection tour_profiles, $id = userId)
------------------------------------------------------------ */
export async function getProfile(userId: string): Promise<TouristProfile | null> {
  try {
    return await getDocument<TouristProfile>(COLLECTIONS.profiles, userId)
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export async function ensureProfile(user: SessionUser): Promise<TouristProfile> {
  const existing = await getProfile(user.id)
  if (existing) return existing

  try {
    return await createDocument<TouristProfile>(
      COLLECTIONS.profiles,
      {
        userId: user.id,
        preferredLanguage: 'fr',
        interests: [],
        shareLocation: false,
        onboardingDone: false,
      },
      {
        documentId: user.id,
        permissions: [
          Permission.read(Role.user(user.id)),
          Permission.update(Role.user(user.id)),
          Permission.delete(Role.user(user.id)),
        ],
      },
    )
  } catch (error) {
    if (isConflict(error)) {
      const profile = await getProfile(user.id)
      if (profile) return profile
    }
    throw error
  }
}

export async function updateProfile(
  userId: string,
  patch: TouristProfileInput,
): Promise<TouristProfile> {
  const data: Record<string, unknown> = { ...patch }

  // Vie privée : si le partage est coupé, on efface la dernière position
  if (patch.shareLocation === false) {
    data.lastLat = null
    data.lastLng = null
    data.lastLocationAt = null
  }

  return updateDocument<TouristProfile>(COLLECTIONS.profiles, userId, data)
}

/** A appeler uniquement si le touriste a activé le partage de position. */
export async function saveLastLocation(
  userId: string,
  position: { lat: number; lng: number },
): Promise<void> {
  await updateDocument<TouristProfile>(COLLECTIONS.profiles, userId, {
    lastLat: position.lat,
    lastLng: position.lng,
    lastLocationAt: new Date().toISOString(),
  })
}

/* ------------------------------------------------------------
   Agences et rôles
------------------------------------------------------------ */
const AGENCY_ROLES: readonly string[] = ['owner', 'admin', 'staff', 'guide']

const isAgencyRole = (role: string): role is AgencyRole => AGENCY_ROLES.includes(role)

/** Agences dont l'utilisateur est membre (via les Teams Appwrite). */
export async function getAgencyMemberships(userId: string): Promise<AgencyMembership[]> {
  const teamList = await teams.list([Query.limit(50)])
  if (teamList.total === 0) return []

  const teamIds = teamList.teams.map((team) => team.$id)
  const { documents: agencies } = await listDocuments<Agency>(COLLECTIONS.agencies, [
    Query.equal('teamId', teamIds),
    Query.limit(50),
  ])

  const results = await Promise.all(
    agencies.map(async (agency): Promise<AgencyMembership | null> => {
      const list = await teams.listMemberships(agency.teamId, [Query.equal('userId', userId)])
      const role = list.memberships.flatMap((m) => m.roles).find(isAgencyRole)
      return role ? { agencyId: agency.$id, teamId: agency.teamId, role } : null
    }),
  )

  return results.filter((membership): membership is AgencyMembership => membership !== null)
}

export function getUserRole(user: SessionUser, memberships: AgencyMembership[]): UserRole {
  if (user.labels.includes('superadmin')) return 'superadmin'
  if (memberships.length > 0) return 'agency_staff'
  return 'tourist'
}

/* ------------------------------------------------------------
   Initialisation après connexion
------------------------------------------------------------ */
export interface SessionBootstrap {
  profile: TouristProfile | null
  memberships: AgencyMembership[]
}

/**
 * Assure le document `users`, le profil touriste et charge les agences.
 * Une erreur ici ne doit jamais bloquer la connexion.
 */
export async function bootstrapSession(user: SessionUser): Promise<SessionBootstrap> {
  const [userDoc, profile, memberships] = await Promise.allSettled([
    ensureUserDoc(user),
    ensureProfile(user),
    getAgencyMemberships(user.id),
  ])

  if (userDoc.status === 'rejected') {
    console.warn('[auth] ensureUserDoc a échoué :', userDoc.reason)
  }
  if (profile.status === 'rejected') {
    console.warn('[auth] ensureProfile a échoué :', profile.reason)
  }
  if (memberships.status === 'rejected') {
    console.warn('[auth] getAgencyMemberships a échoué :', memberships.reason)
  }

  return {
    profile: profile.status === 'fulfilled' ? profile.value : null,
    memberships: memberships.status === 'fulfilled' ? memberships.value : [],
  }
}