import type { BaseDoc, Department, PublishStatus, SortDirection } from './index'

export type SiteCategory =
  | 'historique'
  | 'culturel'
  | 'vodun'
  | 'nature'
  | 'faune'
  | 'lac_lagune'
  | 'plage'
  | 'ville'
  | 'gastronomie'
  | 'artisanat'
  | 'aventure'
  | 'detente'

export type Vibe =
  | 'calme'
  | 'aventure'
  | 'spirituel'
  | 'romantique'
  | 'familial'
  | 'festif'
  | 'authentique'
  | 'educatif'
  | 'sportif'
  | 'contemplatif'

export type Environment =
  | 'eau'
  | 'lagune'
  | 'lac'
  | 'riviere'
  | 'foret'
  | 'savane'
  | 'montagne'
  | 'plage'
  | 'ville'
  | 'village'
  | 'marais'

export type ClimateFeel = 'chaud' | 'tempere' | 'frais' | 'humide' | 'sec'
export type Difficulty = 'facile' | 'modere' | 'difficile'
export type BudgetLevel = 'gratuit' | 'bas' | 'moyen' | 'eleve'

/** Collection `tour_sites` */
export interface Site extends BaseDoc {
  /** null = catalogue commun */
  agencyId: string | null
  name: string
  slug: string
  tagline: string | null
  summary: string
  description: string
  history: string | null

  department: Department
  city: string
  address: string | null
  latitude: number
  longitude: number
  geohash: string

  categories: SiteCategory[]
  vibes: Vibe[]
  environments: Environment[]
  climateFeel: ClimateFeel | null
  activities: string[]
  highlights: string[]

  /** Mois recommandes (1 a 12) */
  bestMonths: number[]
  bestSeasonNote: string | null
  avgVisitMinutes: number | null
  difficulty: Difficulty
  budgetLevel: BudgetLevel | null
  /** En XOF */
  entranceFee: number
  familyFriendly: boolean
  accessibleMobility: boolean
  practicalInfo: string | null
  openingHours: string | null

  coverId: string | null
  gallery: string[]
  videoUrl: string | null
  /** Texte dense utilise par Vanessa pour la recommandation */
  aiContext: string | null

  ratingAvg: number
  ratingCount: number
  status: PublishStatus
  featured: boolean
  publishedAt: string | null
}

export type SiteSort = 'recent' | 'rating' | 'name'

export interface SiteFilters {
  q?: string
  department?: Department
  categories?: SiteCategory[]
  vibes?: Vibe[]
  environments?: Environment[]
  climateFeel?: ClimateFeel
  difficulty?: Difficulty
  budgetLevel?: BudgetLevel
  familyFriendly?: boolean
  /** Mois de visite (1 a 12) */
  month?: number
  featured?: boolean
  sort?: SiteSort
  sortDirection?: SortDirection
  limit?: number
  offset?: number
}