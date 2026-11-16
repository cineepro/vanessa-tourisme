// src/config/constants.ts — Vanessa Tourisme
import type {
  ArticleType,
  BookingStatus,
  BudgetLevel,
  BudgetProfile,
  CancellationPolicy,
  ChatMode,
  ClimateFeel,
  Currency,
  Department,
  Difficulty,
  Environment,
  PaymentMode,
  PaymentStatus,
  PlaceGroup,
  PlaceType,
  PricingType,
  SiteCategory,
  SpokenLanguage,
  TravelStyle,
  Vibe,
} from '@/types'

/* ------------------------------------------------------------
   Identite
------------------------------------------------------------ */
export const APP_NAME = 'Vanessa Tourisme'
export const SLOGAN = 'Vanessa, celle qui connaît le Bénin mieux que vous'
export const DEFAULT_CURRENCY: Currency = 'XOF'

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */
export interface Option<T extends string = string> {
  value: T
  label: string
}

/** Transforme un dictionnaire { valeur: libelle } en liste d'options pour un select. */
export function toOptions<T extends string>(map: Record<T, string>): Option<T>[] {
  return (Object.keys(map) as T[]).map((value) => ({ value, label: map[value] }))
}

/* ------------------------------------------------------------
   Geographie du Benin
------------------------------------------------------------ */
export const DEPARTMENTS: { value: Department; label: string; capital: string }[] = [
  { value: 'Alibori', label: 'Alibori', capital: 'Kandi' },
  { value: 'Atacora', label: 'Atacora', capital: 'Natitingou' },
  { value: 'Atlantique', label: 'Atlantique', capital: 'Allada' },
  { value: 'Borgou', label: 'Borgou', capital: 'Parakou' },
  { value: 'Collines', label: 'Collines', capital: 'Dassa-Zoumè' },
  { value: 'Couffo', label: 'Couffo', capital: 'Aplahoué' },
  { value: 'Donga', label: 'Donga', capital: 'Djougou' },
  { value: 'Littoral', label: 'Littoral', capital: 'Cotonou' },
  { value: 'Mono', label: 'Mono', capital: 'Lokossa' },
  { value: 'Ouémé', label: 'Ouémé', capital: 'Porto-Novo' },
  { value: 'Plateau', label: 'Plateau', capital: 'Pobè' },
  { value: 'Zou', label: 'Zou', capital: 'Abomey' },
]

export const BENIN_CENTER = { lat: 9.3077, lng: 2.3158, zoom: 6 } as const
export const COTONOU = { lat: 6.3703, lng: 2.3912 } as const

/** Rectangle englobant approximatif du Benin */
export const BENIN_BOUNDS = {
  south: 6.2,
  north: 12.45,
  west: 0.75,
  east: 3.9,
} as const

export const DEFAULT_NEARBY_RADIUS_KM = 5

/* ------------------------------------------------------------
   Sites touristiques
------------------------------------------------------------ */
export const SITE_CATEGORY_LABELS: Record<SiteCategory, string> = {
  historique: 'Histoire',
  culturel: 'Culture',
  vodun: 'Vodun',
  nature: 'Nature',
  faune: 'Faune',
  lac_lagune: 'Lacs et lagunes',
  plage: 'Plages',
  ville: 'Villes',
  gastronomie: 'Gastronomie',
  artisanat: 'Artisanat',
  aventure: 'Aventure',
  detente: 'Détente',
}

export const VIBE_LABELS: Record<Vibe, string> = {
  calme: 'Calme',
  aventure: 'Aventure',
  spirituel: 'Spirituel',
  romantique: 'Romantique',
  familial: 'En famille',
  festif: 'Festif',
  authentique: 'Authentique',
  educatif: 'Éducatif',
  sportif: 'Sportif',
  contemplatif: 'Contemplatif',
}

export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  eau: 'Eau',
  lagune: 'Lagune',
  lac: 'Lac',
  riviere: 'Rivière',
  foret: 'Forêt',
  savane: 'Savane',
  montagne: 'Montagne',
  plage: 'Plage',
  ville: 'Ville',
  village: 'Village',
  marais: 'Marais',
}

export const CLIMATE_LABELS: Record<ClimateFeel, string> = {
  chaud: 'Chaud',
  tempere: 'Tempéré',
  frais: 'Frais',
  humide: 'Humide',
  sec: 'Sec',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facile: 'Facile',
  modere: 'Modéré',
  difficile: 'Difficile',
}

export const SITE_BUDGET_LABELS: Record<BudgetLevel, string> = {
  gratuit: 'Gratuit',
  bas: 'Petit budget',
  moyen: 'Budget moyen',
  eleve: 'Budget élevé',
}

export const MONTH_LABELS_LONG = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const

export const MONTH_LABELS_SHORT = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const

/* ------------------------------------------------------------
   Guides, offres, langues
------------------------------------------------------------ */
export const SPOKEN_LANGUAGE_LABELS: Record<SpokenLanguage, string> = {
  fr: 'Français',
  en: 'Anglais',
  fon: 'Fon',
  yoruba: 'Yoruba',
  goun: 'Goun',
  bariba: 'Bariba',
  dendi: 'Dendi',
  es: 'Espagnol',
  pt: 'Portugais',
  de: 'Allemand',
}

export const CURRENCY_LABELS: Record<Currency, string> = {
  XOF: 'F CFA',
  EUR: 'Euro',
  USD: 'Dollar US',
}

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  per_person: 'par personne',
  per_group: 'par groupe',
}

export const CANCELLATION_POLICY_LABELS: Record<
  CancellationPolicy,
  { label: string; description: string }
> = {
  flexible: {
    label: 'Flexible',
    description: 'Annulation gratuite jusqu’au délai indiqué avant la visite.',
  },
  moderate: {
    label: 'Modérée',
    description: 'Annulation gratuite dans le délai indiqué, ensuite non remboursable.',
  },
  strict: {
    label: 'Stricte',
    description: 'Remboursement partiel uniquement, selon les conditions de l’agence.',
  },
}

/* ------------------------------------------------------------
   Reservations et paiements
------------------------------------------------------------ */
export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  pending: { label: 'En attente', className: 'bg-accent-100 text-accent-800' },
  confirmed: { label: 'Confirmée', className: 'bg-primary-100 text-primary-800' },
  rejected: { label: 'Refusée', className: 'bg-danger-100 text-danger-800' },
  cancelled_by_user: { label: 'Annulée par vous', className: 'bg-sable-200 text-sable-700' },
  cancelled_by_agency: { label: 'Annulée par l’agence', className: 'bg-sable-200 text-sable-700' },
  completed: { label: 'Terminée', className: 'bg-primary-50 text-primary-700' },
  no_show: { label: 'Absence', className: 'bg-danger-50 text-danger-700' },
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Non payée',
  deposit_paid: 'Acompte payé',
  paid: 'Payée',
  refunded: 'Remboursée',
  partially_refunded: 'Partiellement remboursée',
}

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  on_site: 'Paiement sur place',
  deposit: 'Acompte en ligne',
  online: 'Paiement en ligne',
}

/* ------------------------------------------------------------
   Lieux utiles (sante, restauration, loisirs...)
------------------------------------------------------------ */
export const PLACE_GROUP_LABELS: Record<PlaceGroup, string> = {
  sante: 'Santé',
  restauration: 'Restauration',
  loisirs: 'Loisirs',
  services: 'Services',
  hebergement: 'Hébergement',
}

/** `icon` = nom d'icone lucide-react, resolu plus tard dans les composants. */
export const PLACE_TYPE_META: Record<
  PlaceType,
  { label: string; group: PlaceGroup; icon: string }
> = {
  hospital: { label: 'Hôpital', group: 'sante', icon: 'Hospital' },
  clinic: { label: 'Clinique / centre de santé', group: 'sante', icon: 'Stethoscope' },
  pharmacy: { label: 'Pharmacie', group: 'sante', icon: 'Pill' },
  restaurant: { label: 'Restaurant', group: 'restauration', icon: 'UtensilsCrossed' },
  maquis: { label: 'Maquis', group: 'restauration', icon: 'Soup' },
  street_food: { label: 'Cuisine de rue', group: 'restauration', icon: 'CookingPot' },
  cinema: { label: 'Cinéma', group: 'loisirs', icon: 'Clapperboard' },
  bar_club: { label: 'Bar / club', group: 'loisirs', icon: 'Music' },
  leisure: { label: 'Sortie / loisir', group: 'loisirs', icon: 'PartyPopper' },
  hotel: { label: 'Hôtel', group: 'hebergement', icon: 'BedDouble' },
  market: { label: 'Marché', group: 'services', icon: 'Store' },
  supermarket: { label: 'Supermarché', group: 'services', icon: 'ShoppingCart' },
  atm: { label: 'Distributeur', group: 'services', icon: 'Banknote' },
  bank: { label: 'Banque', group: 'services', icon: 'Landmark' },
  police: { label: 'Police', group: 'services', icon: 'ShieldAlert' },
  embassy: { label: 'Ambassade', group: 'services', icon: 'Flag' },
  transport: { label: 'Transport', group: 'services', icon: 'Bus' },
  fuel: { label: 'Station-service', group: 'services', icon: 'Fuel' },
}

/* ------------------------------------------------------------
   Articles
------------------------------------------------------------ */
export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  culture: 'Culture',
  history: 'Histoire',
  vodun: 'Vodun',
  customs: 'Coutumes',
  practical: 'Infos pratiques',
  safety: 'Sécurité',
  food: 'Cuisine',
  faq: 'FAQ',
  blog: 'Blog',
}

/* ------------------------------------------------------------
   Profil touriste
------------------------------------------------------------ */
export const TRAVEL_STYLE_LABELS: Record<TravelStyle, string> = {
  solo: 'Voyageur solo',
  couple: 'En couple',
  family: 'En famille',
  friends: 'Entre amis',
  business: 'Voyage d’affaires',
}

export const BUDGET_PROFILE_LABELS: Record<BudgetProfile, string> = {
  low: 'Économique',
  medium: 'Confortable',
  high: 'Premium',
  luxury: 'Luxe',
}

export const INTEREST_OPTIONS = [
  'Histoire',
  'Vodun et spiritualité',
  'Nature et randonnée',
  'Faune',
  'Plages et détente',
  'Gastronomie',
  'Artisanat',
  'Musique et fêtes',
  'Photographie',
  'Architecture',
] as const

/* ------------------------------------------------------------
   Chat avec Vanessa
------------------------------------------------------------ */
export const CHAT_MAX_LENGTH = 1000

export const CHAT_MODE_LABELS: Record<ChatMode, string> = {
  general: 'Discussion libre',
  advisor: 'Choisir un site',
  culture: 'Comprendre le Bénin',
  companion: 'Pendant mon séjour',
}

export const CHAT_QUICK_PROMPTS: Record<ChatMode, string[]> = {
  general: [
    'Que me conseillez-vous de visiter au Bénin ?',
    'Quelle est la meilleure période pour voyager ?',
    'Que goûter absolument ?',
  ],
  advisor: [
    'Je cherche un endroit calme, au bord de l’eau, avec un peu de culture locale.',
    'Je voudrais voir des animaux sauvages.',
    'Quel site pour une journée en famille ?',
    'Je veux comprendre le vodun, par où commencer ?',
  ],
  culture: [
    'Parlez-moi des anciens royaumes du Bénin.',
    'Qu’est-ce que le vodun ?',
    'Quels bons réflexes adopter pour être respectueux sur place ?',
  ],
  companion: [
    'Où est la pharmacie la plus proche ?',
    'Je cherche un bon endroit pour manger des plats locaux.',
    'Que faire ce soir près de moi ?',
    'J’ai perdu mon passeport, que dois-je faire ?',
  ],
}

/* ------------------------------------------------------------
   Routes de l'application
------------------------------------------------------------ */
export const ROUTES = {
  home: '/',
  sites: '/sites',
  site: (slug: string) => `/sites/${slug}`,
  guides: '/guides',
  guide: (slug: string) => `/guides/${slug}`,
  discover: '/decouvrir',
  article: (slug: string) => `/decouvrir/${slug}`,
  practical: '/infos-pratiques',
  about: '/a-propos',
  terms: '/terms',
  privacy: '/privacy',

  // Authentification (mêmes chemins que Vanessa)
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  emailConfirmed: '/email-confirmed',
  oauthCallback: '/oauth-callback',

  // Espace voyageur (connexion requise)
  chat: '/vanessa',
  book: (offerId: string) => `/reserver/${offerId}`,
  bookings: '/mes-reservations',
  booking: (id: string) => `/mes-reservations/${id}`,
  favorites: '/favoris',
  profile: '/profil',
  notifications: '/notifications',

  // Espace agence
  agency: '/agence',
} as const

/* ------------------------------------------------------------
   Numéros d'urgence du Bénin
   Source : liste officielle des numéros courts publiée par l'ARCEP Bénin.
   Seuls les numéros confirmés par toutes les sources consultées sont
   affichés. A revérifier de temps en temps sur arcep.bj.
------------------------------------------------------------ */
export const EMERGENCY_NUMBERS = [
  { label: 'SAMU (urgences médicales)', number: '112' },
  { label: 'Sapeurs-pompiers', number: '118' },
  { label: 'Police', number: '117' },
] as const