import type { BaseDoc, Currency } from './index'

export type LicenseStatus = 'trial' | 'active' | 'suspended' | 'expired'

/** Role d'un membre dans la Team Appwrite de l'agence. */
export type AgencyRole = 'owner' | 'admin' | 'staff' | 'guide'

/** Collection `tour_agencies` */
export interface Agency extends BaseDoc {
  name: string
  slug: string
  teamId: string
  description: string | null
  logoId: string | null
  coverId: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  address: string | null
  city: string | null
  primaryColor: string
  currency: Currency
  commissionRate: number
  licenseStatus: LicenseStatus
  licenseStartsAt: string | null
  licenseEndsAt: string | null
  isActive: boolean
}

export interface AgencyMembership {
  agencyId: string
  teamId: string
  role: AgencyRole
}