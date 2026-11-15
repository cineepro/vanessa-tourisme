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
import { env } from '@/config/env'
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

/* ============================================================
   CONFIGURATION DE LA COLLECTION PARTAGEE `users` (Vanessa)
   ------------------------------------------------------------
   A ADAPTER a ton projet vanessa / vanessa-api :

   1) USER_DOC_KEY_ATTRIBUTE
      - null     : le document `users` a pour $id l'ID du compte Appwrite
                   (cas le plus courant, c'est ce qui est suppose ici).
      - 'userId' : le document a un ID aleatoire et un attribut `userId`
                   qui contient l'ID du compte. Mets le nom de l'attribut.
      Si ce reglage ne correspond pas a Vanessa, on creerait des DOUBLONS.

   2) buildUserDocData : les attributs exacts a ecrire a la creation
      (y compris les attributs obligatoires de ta collection).
============================================================ */
const USER_DOC_KEY_ATTRIBUTE: string | null = null

function buildUserDocData(user: SessionUser): Record<string, unknown> {
  const data: Record<string, unknown> = {
    name: user.name,
    email: user.email,
  }
  if (USER_DOC_KEY_ATTRIBUTE) data[USER_DOC_KEY_ATTRIBUTE] = user.id
  return data
}

/* ------------------------------------------------------------
   Utilitaires
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

function isNotFound(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 404
}

function isConflict(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 409
}

/** N'autorise que les chemins internes (evite les redirections vers un autre site). */
export function sanitizeRedirect(path: string | null | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/'
  return path
}

const appBase = (): string => env.appUrl.replace(/\/$/, '')

/* ------------------------------------------------------------
   Session
------------------------------------------------------------ */
/** Utilisateur connecte, ou null pour un visiteur. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    return toSessionUser(await account.get())
  } catch (error) {
    if (error instanceof AppwriteException && (error.code === 401 || error.code === 403)) {
      return null
    }
    throw error
  }
}

export async function loginWithEmail(email: string, password: string): Promise<SessionUser> {
  try {
    await account.createEmailPasswordSession({ email: email.trim(), password })
  } catch (error) {
    // Deja connecte : on reutilise la session existante
    if (!(error instanceof AppwriteException && error.type === 'user_session_already_exists')) {
      throw error
    }
  }

  const user = await getCurrentUser()
  if (!user) throw new AppError('Connexion impossible. Veuillez réessayer.', 'LOGIN_FAILED')
  return user
}

export interface SignUpInput {
  name: string
  email: string
  password: string
}

/** Cree le compte (partage avec Vanessa) puis ouvre la session. */
export async function signUpWithEmail({ name, email, password }: SignUpInput): Promise<SessionUser> {
  try {
    await account.create({
      userId: ID.unique(),
      email: email.trim(),
      password,
      name: name.trim(),
    })
  } catch (error) {
    if (error instanceof AppwriteException && error.type === 'user_already_exists') {
      throw new AppError(
        'Un compte existe déjà avec cet email, peut-être créé sur Vanessa. Connectez-vous avec les mêmes identifiants.',
        'ACCOUNT_EXISTS',
        409,
      )
    }
    throw error
  }
  return loginWithEmail(email, password)
}

/** Redirige vers Google. Au retour, /auth/callback finalise la connexion. */
export function loginWithGoogle(next = '/'): void {
  const target = encodeURIComponent(sanitizeRedirect(next))
  account.createOAuth2Session({
    provider: OAuthProvider.Google,
    success: `${appBase()}/auth/callback?next=${target}`,
    failure: `${appBase()}/connexion?error=oauth`,
  })
}

export async function logout(): Promise<void> {
  try {
    await account.deleteSession({ sessionId: 'current' })
  } catch (error) {
    if (!(error instanceof AppwriteException && (error.code === 401 || error.code === 404))) {
      throw error
    }
  }
}

/* ------------------------------------------------------------
   Mot de passe et verification d'email
------------------------------------------------------------ */
export async function requestPasswordReset(email: string): Promise<void> {
  await account.createRecovery({
    email: email.trim(),
    url: `${appBase()}/mot-de-passe-oublie`,
  })
}

export async function confirmPasswordReset(
  userId: string,
  secret: string,
  password: string,
): Promise<void> {
  await account.updateRecovery({ userId, secret, password })
}

export async function sendVerificationEmail(): Promise<void> {
  await account.createVerification({ url: `${appBase()}/verification-email` })
}

export async function confirmVerification(userId: string, secret: string): Promise<void> {
  await account.updateVerification({ userId, secret })
}

export async function updateAccountName(name: string): Promise<SessionUser> {
  return toSessionUser(await account.updateName({ name: name.trim() }))
}

export async function changePassword(oldPassword: string, password: string): Promise<void> {
  await account.updatePassword({ password, oldPassword })
}

/* ------------------------------------------------------------
   Collection partagee `users` (anti-doublon avec Vanessa)
------------------------------------------------------------ */
export async function ensureUserDoc(user: SessionUser): Promise<void> {
  // 1) Le document existe-t-il deja (cree par Vanessa ou ici) ?
  if (USER_DOC_KEY_ATTRIBUTE) {
    const { total } = await listDocuments<UserDoc>(COLLECTIONS.users, [
      Query.equal(USER_DOC_KEY_ATTRIBUTE, user.id),
      Query.limit(1),
    ])
    if (total > 0) return
  } else {
    try {
      await getDocument<UserDoc>(COLLECTIONS.users, user.id)
      return
    } catch (error) {
      if (!isNotFound(error)) throw error
    }
  }

  // 2) Sinon on le cree, exactement comme Vanessa
  try {
    await createDocument<UserDoc>(COLLECTIONS.users, buildUserDocData(user), {
      documentId: USER_DOC_KEY_ATTRIBUTE ? undefined : user.id,
    })
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

  // Vie privee : si le partage est coupe, on efface la derniere position
  if (patch.shareLocation === false) {
    data.lastLat = null
    data.lastLng = null
    data.lastLocationAt = null
  }

  return updateDocument<TouristProfile>(COLLECTIONS.profiles, userId, data)
}

/** A appeler uniquement si le touriste a active le partage de position. */
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
   Agences et roles
------------------------------------------------------------ */
const AGENCY_ROLES: readonly string[] = ['owner', 'admin', 'staff', 'guide']

const isAgencyRole = (role: string): role is AgencyRole => AGENCY_ROLES.includes(role)

/** Agences dont l'utilisateur est membre (via les Teams Appwrite). */
export async function getAgencyMemberships(userId: string): Promise<AgencyMembership[]> {
  const teamList = await teams.list({ queries: [Query.limit(50)] })
  if (teamList.total === 0) return []

  const teamIds = teamList.teams.map((team) => team.$id)
  const { documents: agencies } = await listDocuments<Agency>(COLLECTIONS.agencies, [
    Query.equal('teamId', teamIds),
    Query.limit(50),
  ])

  const results = await Promise.all(
    agencies.map(async (agency): Promise<AgencyMembership | null> => {
      const list = await teams.listMemberships({
        teamId: agency.teamId,
        queries: [Query.equal('userId', userId)],
      })
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
   Initialisation apres connexion
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
    console.warn('[auth] ensureUserDoc a echoue :', userDoc.reason)
  }
  if (profile.status === 'rejected') {
    console.warn('[auth] ensureProfile a echoue :', profile.reason)
  }
  if (memberships.status === 'rejected') {
    console.warn('[auth] getAgencyMemberships a echoue :', memberships.reason)
  }

  return {
    profile: profile.status === 'fulfilled' ? profile.value : null,
    memberships: memberships.status === 'fulfilled' ? memberships.value : [],
  }
}